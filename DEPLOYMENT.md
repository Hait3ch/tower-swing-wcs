# Tower Swing – Deployment Guide

The whole site is one Next.js app on **Vercel**, backed by **Supabase**. There is no separate backend server anymore.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema from this repo:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. **Authentication → URL Configuration**
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `https://<your-domain>/auth/callback`
4. **Authentication → SMTP Settings**: enable custom SMTP so sign-in emails come from the Tower Swing address (Gmail: host `smtp.gmail.com`, port `465`, user = Gmail address, password = Gmail App Password). The built-in sender is heavily rate-limited.
5. Add admins (SQL editor):
   ```sql
   insert into admins (email) values ('towerswingwcs@gmail.com');
   ```

## 2. Vercel project

- Root directory: `frontend`
- Framework preset: Next.js
- Environment variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**server only**) |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |
| `CRON_SECRET` | long random string; Vercel Cron sends it automatically |
| `GMAIL_USER` | Gmail address used for Tower Swing emails |
| `GMAIL_PASSWORD` | Gmail App Password |
| `GMAIL_FROM_EMAIL` | sender address, e.g. `towerswingwcs@gmail.com` |

`frontend/vercel.json` schedules `/api/cron/sync-wsdc` daily at 03:17 UTC. After the first deploy, trigger it once from **Vercel → Cron Jobs → Run** (or `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/sync-wsdc`) and check that `/partners` lists events.

## 3. Move existing data from MongoDB

```bash
mongoexport --uri "$MONGODB_URI" --collection events --jsonArray --out events.json
mongoexport --uri "$MONGODB_URI" --collection registrations --jsonArray --out registrations.json
cd frontend
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-mongo.mts ../events.json ../registrations.json
```

The script is safe to re-run. Compare the printed counts with MongoDB. The event that was active in MongoDB becomes the active event.

## 4. Cutover checklist

- [ ] Supabase migrations applied (`npx supabase db push`)
- [ ] Auth URL configuration and SMTP set
- [ ] Admin emails inserted
- [ ] Vercel env vars set and deployed
- [ ] First cron run OK, `/partners` shows events
- [ ] MongoDB data imported, counts match
- [ ] Test: register on `/register`, sign in on `/admin`, join a queue on `/partners/<event>`
- [ ] After a week without issues: shut down the Render service and the MongoDB Atlas cluster

## Troubleshooting

- **Sign-in link goes to the wrong site** – check Site URL / Redirect URLs in Supabase Auth.
- **No sign-in emails** – configure custom SMTP in Supabase; check the Gmail App Password.
- **Cron returns 401** – `CRON_SECRET` missing or different in Vercel.
- **Cron returns 500 "WSDC parse returned 0 events"** – the WSDC page layout changed; nothing was modified in the database. Update `frontend/lib/wsdc/parse.ts` and its fixture.
- **Admin page says "not an admin"** – add the email to the `admins` table.
