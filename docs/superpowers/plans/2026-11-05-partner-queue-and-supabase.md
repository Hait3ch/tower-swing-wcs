# Partner Queue + Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "find a dance partner" queue for European WCS events to the Tower Swing site, and move the whole site (including Tower Swing registration and admin) from Express + MongoDB to Supabase.

**Architecture:** The `frontend/` Next.js 15 app becomes the only app. It talks to Supabase (Postgres + Auth + Row Level Security) through `@supabase/ssr`, using server components and server actions. A daily Vercel Cron route fetches the WSDC events page and upserts the European events. The `backend/` Express app is deleted once Mongo data has been copied over.

**Tech Stack:** Next.js 15.3 (App Router), React 19, Tailwind 4, TypeScript, `@supabase/supabase-js` + `@supabase/ssr`, Supabase Postgres with RLS, Supabase Auth email magic links, nodemailer (Gmail SMTP, kept for Tower Swing emails), Vitest, pgTAP (`supabase test db`), Vercel Cron.

**Spec:** The decisions below come from the conversation of 2026-11-05 and are the spec:

- **Problem:** followers in the Finnish WCS WhatsApp group can't see who is waiting for a partner for an event, so they argue about who was first.
- **Events:** all European events from https://worldsdc.com/events/, plus events anyone can add. Each event shows its name, dates, city/location, country and a link to its website.
- **Queue:** each event has two lists, "Followers looking for a leader" and "Leaders looking for a follower", ordered by join time. Queue numbers are only for transparency; leaders still choose freely.
- **Login:** Supabase email magic link.
- **Adding events:** anyone who is signed in; admins can remove events.
- **Language:** English only.
- **Migration:** move everything to Supabase, including Tower Swing events, registrations and admin.

## Global Constraints

- All UI copy is in English.
- Keep the existing look: Tailwind, blue→purple gradient (`from-blue-600 to-purple-600`), Nunito body font, Dancing Script headings.
- Next.js stays on `15.3.x`, React 19. No new UI framework.
- Read Supabase secrets on the server only. `SUPABASE_SERVICE_ROLE_KEY` must never appear in any file under `app/` that has `"use client"`.
- Every table has RLS enabled. No table is writable by `anon`.
- Phone numbers are readable only by signed-in users.
- **Europe** means these ISO-3166 alpha-3 codes: `ALB AND AUT BEL BIH BGR BLR CHE CYP CZE DEU DNK ESP EST FIN FRA GBR GRC HRV HUN IRL ISL ITA LIE LTU LUX LVA MCO MDA MKD MLT MNE NLD NOR POL PRT ROU SMR SRB SVK SVN SWE UKR`. Russia (`RUS`) and Turkey (`TUR`) are deliberately excluded.
- Hide events from the day after their `end_date`. Delete events and their queue entries automatically 30 days after `end_date`.
- WSDC requests use User-Agent `TowerSwingPartnerQueue/1.0 (+https://<site-domain>)`.

## Review Focus

1. **The WSDC page changes or the fetch fails.** If the sync parses 0 rows or gets a non-200 response, it must abort without changing the database, and existing events and queues stay untouched. *(Test in Task 4.)*
2. **Messy WSDC data.** The country code can be empty or `transparent` (all Russian events). URLs can be malformed, e.g. `http://Https://parisswingclassic.com`. Date ranges can cross a year boundary (`Dec 31 2026 - Jan 2 2027`). The parser must handle all of these without dropping or misdating events. *(Tests in Task 3.)*
3. **Two clicks on "Join", or two people joining at the same moment.** A user has at most one active entry per event, and queue numbers stay stable and gapless for the people still looking. *(Tests in Tasks 2 and 7.)*
4. **Two people registering for the last Tower Swing spot at once.** Exactly one of them gets `pending` and the other gets `waiting`. *(Test in Task 8.)*
5. **Privacy.** Anonymous visitors see names and notes but never phone numbers or emails, and nobody can edit or delete another user's entry. *(Tests in Task 2.)*

---

## File Structure

```
frontend/
  middleware.ts                         # refresh Supabase session cookie
  vercel.json                           # cron schedule
  vitest.config.ts
  lib/supabase/server.ts                # createServerClient (cookies)
  lib/supabase/browser.ts               # createBrowserClient
  lib/supabase/admin.ts                 # service-role client (server only)
  lib/europe.ts                         # EUROPE_ISO3, countryNameToIso3, iso3ToName
  lib/wsdc/parse.ts                     # parseWsdcHtml, parseDateRange, normalizeUrl
  lib/wsdc/sync.ts                      # syncWsdcEvents(fetchImpl, db)
  lib/partners/queue.ts                 # numberQueue, waLink
  lib/email.ts                          # nodemailer, ported from backend
  app/api/cron/sync-wsdc/route.ts
  app/auth/login/page.tsx               # magic link form
  app/auth/callback/route.ts            # exchangeCodeForSession
  app/account/page.tsx                  # display name + phone
  app/partners/page.tsx                 # European event list + filters
  app/partners/new/page.tsx             # add-event form
  app/partners/[slug]/page.tsx          # two queues
  app/partners/actions.ts               # joinQueue, leaveQueue, markMatched, addEvent
  app/register/actions.ts               # registerForTowerSwing
  app/admin/...                         # rewritten on Supabase
  tests/fixtures/wsdc-events.html
  tests/*.test.ts
supabase/
  config.toml
  migrations/20261105000000_init.sql
  tests/rls.test.sql                    # pgTAP
scripts/migrate-mongo.ts                # one-off Mongo → Supabase copy
backend/                                # deleted in Task 10
```

---

### Task 1: Supabase + test tooling in the Next.js app

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`, `frontend/lib/supabase/{server,browser,admin}.ts`, `frontend/middleware.ts`, `frontend/.env.example`, `supabase/config.toml` (via `npx supabase init` at repo root)
- Test: `frontend/tests/smoke.test.ts`

**Interfaces:**
- Produces: `createClient(): Promise<SupabaseClient>` (server.ts, async because Next 15 `cookies()` is async), `createBrowserSupabase(): SupabaseClient` (browser.ts), `createAdminClient(): SupabaseClient` (admin.ts, uses `SUPABASE_SERVICE_ROLE_KEY`, file starts with `import "server-only"`).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `GMAIL_USER`, `GMAIL_PASSWORD`, `GMAIL_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`.

- [ ] **Step 1:** `cd frontend && npm i @supabase/supabase-js @supabase/ssr server-only nodemailer && npm i -D vitest @types/nodemailer`. Add `"test": "vitest run"` to scripts.
- [ ] **Step 2:** Write `tests/smoke.test.ts` asserting `createAdminClient` throws `"SUPABASE_SERVICE_ROLE_KEY missing"` when the env var is unset. Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement the three clients, plus `middleware.ts` using the standard `@supabase/ssr` `updateSession` pattern with matcher `['/((?!_next/static|_next/image|favicon|assets).*)']`.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS, build succeeds.
- [ ] **Step 5:** Commit: `chore: add supabase clients and vitest`.

### Task 2: Database schema and RLS

**Files:**
- Create: `supabase/migrations/20261105000000_init.sql`, `supabase/tests/rls.test.sql`

**Interfaces:**
- Produces these tables, with RLS on for all of them:
  - `profiles(user_id uuid pk → auth.users, display_name text not null check (length between 1 and 60), phone text null, created_at)`
  - `admins(email text pk)` plus a function `is_admin() returns boolean` (security definer, checks `auth.jwt()->>'email'`)
  - `dance_events(id uuid pk, slug text unique not null, name text not null, url text, event_type text, location text, country_code char(3), start_date date not null, end_date date not null, source text check in ('wsdc','user'), wsdc_key text unique, created_by uuid null, created_at, updated_at)`
  - `partner_entries(id uuid pk, event_id uuid → dance_events on delete cascade, user_id uuid → auth.users, role text check in ('leader','follower'), note text check (length <= 200), status text check in ('looking','matched','withdrawn') default 'looking', created_at timestamptz default now(), updated_at)` with partial unique index `(event_id, user_id) where status = 'looking'`
  - view `partner_queue` (security_invoker) = entries with `status='looking'` joined to `profiles.display_name`, ordered by `created_at, id`. Columns: `id, event_id, user_id, role, note, created_at, display_name`.
  - `tower_events` mirrors Mongo `Event` (year, name, date, max_capacity, is_active, registration_open, waiting_list_enabled, price, venue, address, description) with partial unique index `on (is_active) where is_active`.
  - `tower_registrations` mirrors Mongo `Registration` (snake_case, `email unique`, `payment_status` check in pending/paid/cancelled/waiting, `event_id → tower_events`).
  - function `register_tower(p jsonb) returns tower_registrations` (security definer). It locks the active event row `for update`, counts non-cancelled/non-waiting registrations, and inserts with `pending` or `waiting`. It raises `no_active_event`, `registration_closed` or `duplicate_email`.
  - function `purge_old_events() returns int`: deletes `dance_events` whose `end_date < current_date - 30`, and their entries via cascade. Past events are hidden in the UI from the day after `end_date`.
- **Policies:**
  - `dance_events`: select for everyone; insert for authenticated users with `source='user' and created_by=auth.uid()`; delete when `is_admin()`.
  - `partner_entries`: select for everyone; insert/update only own rows (`user_id = auth.uid()`); delete when own or `is_admin()`.
  - `profiles`: select for authenticated users; insert/update own.
  - `tower_*`: select `tower_events` for everyone; everything else when `is_admin()`. Registration inserts go only through `register_tower`.

- [ ] **Step 1: Write the pgTAP tests in `supabase/tests/rls.test.sql`:**
  - `anon` can select `dance_events` and `partner_queue`.
  - `anon` selecting `profiles` returns 0 rows.
  - `anon` cannot insert into `dance_events` (throws 42501).
  - User A cannot update User B's entry (0 rows affected).
  - A second `looking` entry for the same user and event throws 23505.
  - After A withdraws, A can rejoin.
  - A non-admin deleting a `dance_events` row affects 0 rows; an admin's delete affects 1.
  - `purge_old_events()` deletes an event (and its entries) that ended 31 days ago, and keeps one that ended 29 days ago.
  - `anon` cannot select `tower_registrations`.
- [ ] **Step 2:** Run `npx supabase start && npx supabase test db`. Expected: FAIL (relations missing). *(Needs Docker. If Docker isn't available, run against a Supabase dev branch with `psql -f`.)*
- [ ] **Step 3:** Write the migration.
- [ ] **Step 4:** Run `npx supabase db reset && npx supabase test db`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat(db): schema and RLS for partner queue and tower swing`.

### Task 3: WSDC page parser

**Files:**
- Create: `frontend/lib/europe.ts`, `frontend/lib/wsdc/parse.ts`, `frontend/tests/fixtures/wsdc-events.html`
- Test: `frontend/tests/wsdc-parse.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type WsdcEvent = { wsdcKey: string; name: string; url: string | null; eventType: string;
    location: string; countryCode: string | null; startDate: string; endDate: string; isTrial: boolean };
  parseWsdcHtml(html: string): WsdcEvent[]
  parseDateRange(text: string): { start: string; end: string }   // ISO yyyy-mm-dd
  normalizeUrl(raw: string): string | null
  EUROPE_ISO3: ReadonlySet<string>; countryNameToIso3(name: string): string | null; iso3ToName(code: string): string
  ```
- `wsdcKey` = `slugify(name) + "-" + startYear`. The key uses the year, not the full date, so a date correction on WSDC updates the existing event instead of creating a duplicate. Upserts overwrite the dates and other fields.
- **Row shape on the real page:** `<tr class="…"><td>DATES</td><td><div class="event_name"><a href="URL">NAME</a></div><div class="event_type">TYPE</div></td><td>LOCATION</td><td><a href="?country=CODE">…`. The class contains `event-trial` for trial events. Parse with regex over `<tr …>` rows; don't add an HTML-parser dependency.
- **Country:** use `?country=` when it is 3 uppercase letters. Otherwise (`''` or `transparent`), use `countryNameToIso3` on the last comma-separated part of the location. That function knows the English and native names that appear on the page: `Russia`, `Deutschland`, `Nederland`, `US`, `United States`, `United states`.

- [ ] **Step 1:** Save the fixture with `curl -sSL -A "TowerSwingPartnerQueue/1.0" https://worldsdc.com/events/ -o frontend/tests/fixtures/wsdc-events.html`.
- [ ] **Step 2: Write the tests:**
  - `parseDateRange('Feb 25 - 28, 2027')` → `{start:'2027-02-25', end:'2027-02-28'}`
  - `parseDateRange('Feb 25 - Mar 1, 2027')` → `{start:'2027-02-25', end:'2027-03-01'}`
  - `parseDateRange('Dec 31 2026 - Jan 2 2027')` → `{start:'2026-12-31', end:'2027-01-02'}`
  - `parseDateRange('Dec 30 - Jan 2, 2027')` → `{start:'2026-12-30', end:'2027-01-02'}`
  - `parseDateRange('garbage')` throws
  - `normalizeUrl('http://Https://parisswingclassic.com')` → `'https://parisswingclassic.com'`
  - `normalizeUrl('www.x.com')` → `'https://www.x.com'`
  - `normalizeUrl('')` → `null`
  - The fixture parses to ≥150 events.
  - The `Winter Coast Swing` event equals `{countryCode:'FIN', location:'Kuopio, Leppävirta, Finland', url:'https://www.wintercoastswing.com', startDate:'2027-02-26', isTrial:false}`. Read the dates from the fixture row when writing this assertion.
  - Every event whose location ends in `Russia` has `countryCode 'RUS'`.
  - `New York Flow Festival` has `'USA'`.
  - At least one event has `isTrial === true`.
  - `EUROPE_ISO3.has('FIN')`, `!EUROPE_ISO3.has('USA')`, `!EUROPE_ISO3.has('RUS')`, `!EUROPE_ISO3.has('TUR')`.
- [ ] **Step 3:** Run `npm test -- wsdc-parse`. Expected: FAIL.
- [ ] **Step 4:** Implement.
- [ ] **Step 5:** Run `npm test -- wsdc-parse`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat: parse WSDC events page`.

### Task 4: Daily WSDC sync

**Files:**
- Create: `frontend/lib/wsdc/sync.ts`, `frontend/app/api/cron/sync-wsdc/route.ts`, `frontend/vercel.json`
- Test: `frontend/tests/wsdc-sync.test.ts`

**Interfaces:**
- Consumes: `parseWsdcHtml`, `EUROPE_ISO3`, `createAdminClient`.
- Produces: `syncWsdcEvents(deps: { fetchHtml: () => Promise<string>; upsert: (rows: DanceEventRow[]) => Promise<void>; purge: () => Promise<number> }): Promise<{ upserted: number; purged: number }>`.
- **Behavior:**
  - Keep only events where `EUROPE_ISO3.has(countryCode)`.
  - Map each to a row with `source:'wsdc'`, `slug = wsdcKey`, `event_type = isTrial ? 'Trial Event' : eventType`.
  - **Matching an incoming event to an existing one**, so renames and date fixes update the event instead of duplicating it:
    1. If an event with the same `wsdc_key` exists, it's the same event.
    2. Otherwise, if exactly one existing `source='wsdc'` event has the same URL host (from `normalizeUrl`, `www.` stripped) and its `start_date` is within 60 days of the incoming one, it's the same event. This catches renames.
    3. Otherwise, it's a new event.
    
    When it's the same event, update the name, dates, location, URL, type and `wsdc_key`. Keep the `id` and `slug`, so queue links keep working.
  - Never delete an event just because it's missing from WSDC: people queued for it would lose their place. Removing cancelled events is an admin action.
  - Then call `purge()` (the `purge_old_events` RPC).
  - Expose the matching rule as the pure function `matchExisting(incoming: DanceEventRow, existing: DanceEventRow[]): DanceEventRow | null`.
- **Route:** `GET` requires `Authorization: Bearer ${CRON_SECRET}`, otherwise 401. On success it returns JSON with the counts.
- **`vercel.json`:** `{"crons":[{"path":"/api/cron/sync-wsdc","schedule":"17 3 * * *"}]}`.

- [ ] **Step 1: Write the tests (with fakes for the deps):**
  - The fixture produces upserted rows that are all European and include `Winter Coast Swing`. No row has `country_code` `RUS`.
  - Syncing the same event twice with a changed `startDate` (same year) produces one row with the new dates, not two.
  - `matchExisting`: a renamed event with the same URL host and dates 10 days apart matches. Two existing events on the same host (e.g. a festival platform) → `null`. Same host but 200 days apart (next year's edition) → `null`.
  - `fetchHtml` rejecting → `syncWsdcEvents` rejects, and `upsert`/`purge` are never called.
  - `fetchHtml` returning `'<html></html>'` → rejects with `"WSDC parse returned 0 events"`, and `upsert` is not called.
  - Calling the route without the header → 401.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. `fetchHtml` throws on a non-2xx response.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: daily WSDC sync cron`.

### Task 5: Magic-link login and account page

**Files:**
- Create: `frontend/app/auth/login/page.tsx`, `frontend/app/auth/callback/route.ts`, `frontend/app/account/page.tsx`, `frontend/app/account/actions.ts`
- Modify: `frontend/components/Carousel.tsx` nav (add "Find a partner" → `/partners` and "Sign in"/"Account")

**Interfaces:**
- Produces: `saveProfile(formData: FormData): Promise<{ error?: string }>` (fields: `display_name`, `phone`) and `getCurrentProfile(): Promise<Profile | null>` in `account/actions.ts`.
- **Login:** calls `signInWithOtp({ email, options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=<path>` } })`.
- **Callback:** `exchangeCodeForSession`, then redirects to `next` if the profile exists, otherwise to `/account?next=…`.
- **Phone validation:** after removing spaces, it must match `^\+?[0-9]{7,15}$`, or be empty.

- [ ] **Step 1:** Write `tests/profile.test.ts` for the exported pure validator `validateProfile({display_name, phone})`:
  - `''` name → error
  - a 61-character name → error
  - `'+358 40 123 4567'` → ok, normalized to `'+358401234567'`
  - `'abc'` phone → error
  - empty phone → ok with `null`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the validator, the pages and the actions.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS. Then check manually against a dev project: the login email arrives, the link signs you in, and the profile saves.
- [ ] **Step 5:** Commit: `feat: magic link auth and profile`.

### Task 6: Event list and add-event form

**Files:**
- Create: `frontend/app/partners/page.tsx`, `frontend/app/partners/new/page.tsx`, `frontend/app/partners/actions.ts` (the `addEvent` part), `frontend/components/partners/EventCard.tsx`
- Test: `frontend/tests/add-event.test.ts`

**Interfaces:**
- Produces: `addEvent(formData: FormData): Promise<{ slug?: string; error?: string }>` and the pure `validateNewEvent(input): { ok: true; row } | { ok: false; error }`.
- **List:**
  - Shows events with `end_date >= today`, ordered by `start_date`.
  - URL search params `country` (ISO3), `month` (`yyyy-mm`) and `q` (name contains, case-insensitive).
  - Each card shows the name, a date range like `Feb 26 – 28, 2027`, the location, the country name with a flag emoji built from the ISO2 code, a "Trial" or "Added by community" badge, how many leaders and followers are waiting, and a link to `/partners/[slug]`.
- **Add form** (signed in only): name, url, start_date, end_date, location, and country (a select of `EUROPE_ISO3`, with "Other" allowed). It creates the slug as `slugify(name)-start_date`.
- **Duplicate check:** if another event has the same normalized URL host and overlapping dates, return `{ error: 'This event already exists', slug: existing }` so the page can link to it.

- [ ] **Step 1: Write the tests for `validateNewEvent`:**
  - `end < start` → error
  - empty name → error
  - start date in the past → error
  - a valid input → a row with `source:'user'`, the expected slug, and a normalized URL
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the validator, the pages and the action.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS. Then check manually: the filters change the list, and adding a duplicate URL links to the existing event.
- [ ] **Step 5:** Commit: `feat: partner event list and add event`.

### Task 7: Event queue page

**Files:**
- Create: `frontend/app/partners/[slug]/page.tsx`, `frontend/lib/partners/queue.ts`, `frontend/components/partners/QueueList.tsx`
- Modify: `frontend/app/partners/actions.ts`
- Test: `frontend/tests/queue.test.ts`

**Interfaces:**
- Consumes: the `partner_queue` view and `profiles`.
- Produces:
  ```ts
  numberQueue(rows: QueueRow[]): Array<QueueRow & { position: number }>  // per role, by created_at then id, 1-based
  waLink(phone: string, eventName: string): string  // https://wa.me/<digits>?text=<encoded "Hi! I saw you're looking for a partner for {eventName} on Tower Swing.">
  joinQueue(eventId: string, role: 'leader'|'follower', note: string): Promise<{ error?: string }>
  leaveQueue(entryId: string): Promise<void>      // status → 'withdrawn'
  markMatched(entryId: string): Promise<void>     // status → 'matched'
  ```
- **Page:**
  - The header shows the event info and a "Event website" link.
  - Two columns, "Followers looking for a leader" and "Leaders looking for a follower". Each row shows `#position`, display name, note and "joined 3 days ago".
  - For signed-in users, each row also gets a WhatsApp button (`waLink`) when the person has a phone number.
  - Fixed copy at the top: "Queue numbers show who has waited longest. Leaders and followers are free to choose, but please be fair and check the list first."
  - If the user is in a queue: a "You're #N" box with "Found a partner 🎉" and "Leave queue" buttons. Otherwise: "Join as follower / leader" plus an optional note (a profile is required first).
  - Has `generateMetadata` with the title `Find a partner – {event}` and a description, so the link preview in WhatsApp is useful.
- `joinQueue` returns `{ error: 'You are already in this queue' }` on a unique violation (23505).

- [ ] **Step 1: Write the tests:**
  - `numberQueue` on mixed roles gives followers 1..n and leaders 1..m.
  - Ties on `created_at` are broken by `id`.
  - Removing the middle row renumbers the rest without gaps.
  - `waLink('+358 40 123', 'Westie Gala')` → `'https://wa.me/35840123?text=Hi!%20I%20saw…'`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS. Then check manually with two accounts: B sees A as #1, A's matched entry disappears, and a signed-out visitor sees no WhatsApp buttons.
- [ ] **Step 5:** Commit: `feat: partner queue page`.

### Task 8: Tower Swing registration on Supabase

**Files:**
- Create: `frontend/lib/email.ts` (port `backend/src/services/emailService.ts` unchanged except for the import style), `frontend/app/register/actions.ts`
- Modify: `frontend/app/register/page.tsx` (replace the `fetch(NEXT_PUBLIC_API_URL…)` call with the server action, and keep the form fields as they are)
- Test: `frontend/tests/register.test.ts`, plus an addition to `supabase/tests/rls.test.sql`

**Interfaces:**
- Consumes: the `register_tower` RPC and `sendRegistrationConfirmation`/`sendPaymentConfirmation` from `lib/email.ts` (same `EmailData` type).
- Produces: `registerForTowerSwing(input: RegistrationInput): Promise<{ ok: true; isWaitingList: boolean; message: string } | { ok: false; message: string }>`. Messages match the old API exactly: `'Registration successful'`, `'Registration successful! You have been added to the waiting list.'`, `'A registration with this email already exists'`, `'Registration is currently closed for this event.'`, `'No active event found. Registration is currently closed.'`.
- An email failure is logged and doesn't fail the registration.

- [ ] **Step 1: Write the tests:**
  - **pgTAP:** with `max_capacity = 1`, two `register_tower` calls give `pending` then `waiting`; a duplicate email raises `duplicate_email`.
  - **Vitest** (with a mocked RPC): each RPC error is mapped to the exact message above, and an email throw still returns `ok: true`.
- [ ] **Step 2:** Run both. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run both. Expected: PASS. Run `npm run build`.
- [ ] **Step 5:** Commit: `feat: tower swing registration on supabase`.

### Task 9: Admin on Supabase

**Files:**
- Modify: `frontend/app/admin/page.tsx` (becomes a magic-link login, then a check of `is_admin()`), `frontend/app/admin/dashboard/page.tsx`, `frontend/app/admin/events/page.tsx`
- Create: `frontend/app/admin/actions.ts`, `frontend/app/admin/partners/page.tsx`
- Test: `frontend/tests/admin.test.ts`

**Interfaces:**
- Produces:
  ```ts
  requireAdmin(): Promise<void>  // redirect('/admin') if not admin
  updateRegistrationStatus(id: string, status: PaymentStatus): Promise<void>  // sends payment email on 'paid', confirmation on 'pending', as backend did
  deleteRegistration(id: string): Promise<void>
  saveTowerEvent(input: TowerEventInput, id?: string): Promise<void>
  activateTowerEvent(id: string): Promise<void>  // sets others inactive in one statement
  deleteDanceEvent(id: string): Promise<void>
  deletePartnerEntry(id: string): Promise<void>
  ```
- Remove the JWT `localStorage` token logic. Admins are the rows in the `admins` table; seed it with the current `ADMIN_EMAIL`.
- **`/admin/partners`:** a list of user-added events with their creator's display name, plus delete buttons for events and entries.

- [ ] **Step 1:** Write tests for the email side effects of `updateRegistrationStatus`, with a mocked db and mailer: `'paid'` → `sendPaymentConfirmation` once; `'pending'` → `sendRegistrationConfirmation` with `waitingListStatus:'none'`; `'cancelled'` → no email.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement and rewrite the three admin pages to use server actions and server-side reads.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS. Then check manually: a non-admin email is redirected; an admin can change a status and delete an event.
- [ ] **Step 5:** Commit: `feat: admin on supabase`.

### Task 10: Copy Mongo data over and remove the Express backend

**Files:**
- Create: `scripts/migrate-mongo.ts`
- Delete: `backend/`
- Modify: `README.md`, `DEPLOYMENT.md`, `PHASE_SUMMARY.md` (stack → Next.js + Supabase on Vercel; env list from Task 1; cron; admin setup)

**Interfaces:**
- `scripts/migrate-mongo.ts <events.json> <registrations.json>` reads `mongoexport --jsonArray` files and inserts them with the service-role client.
  - It keeps a map from Mongo `_id` to Postgres `uuid` and fills `tower_registrations.event_id` from it.
  - It converts camelCase to snake_case.
  - It is idempotent: it upserts events on `(year, name)` and registrations on `email`.
  - It prints the inserted counts.

- [ ] **Step 1:** Write `tests/migrate-mongo.test.ts` for the pure `mapEvent(doc)` / `mapRegistration(doc, idMap)`:
  - `{ $date: '2025-06-28T13:00:00Z' }` dates convert.
  - A missing `eventId` gives `event_id: null`.
  - `paymentStatus` is preserved.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the script.
- [ ] **Step 4:** Run `npm test`. Expected: PASS. Then run the export and import against production, and compare row counts with Mongo.
- [ ] **Step 5:** Delete `backend/` and update the docs. Run `npm run build`.
- [ ] **Step 6:** Commit: `chore: migrate data to supabase, remove express backend`.
- [ ] **Step 7: Cutover checklist (manual):**
  1. Set the Vercel env vars.
  2. Set Supabase Auth → URL config (site URL plus `/auth/callback` redirect).
  3. Point Supabase Auth's SMTP at Gmail so magic links come from the Tower Swing address.
  4. Confirm the first cron run in the Vercel logs.
  5. Shut down the Render service and the Mongo cluster after one week.
