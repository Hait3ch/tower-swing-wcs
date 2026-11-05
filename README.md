# 🏢 Tower Swing - West Coast Swing Dance Event

The highest West Coast Swing dance event in Helsinki, plus a **partner finder** for European WCS events.

## ✨ Features

- **🎫 Tower Swing registration** – form with waiting list and email confirmations
- **💃 Find a partner** (`/partners`) – every European event from the [WSDC calendar](https://worldsdc.com/events/) plus community-added events, each with a fair, public queue: "Followers looking for a leader" and "Leaders looking for a follower"
- **✉️ Passwordless sign-in** – email magic links (Supabase Auth)
- **🔐 Admin** (`/admin`) – registrations, Tower Swing events, partner-queue moderation
- **🔄 Daily WSDC sync** – Vercel Cron keeps the event list fresh, follows renames and date changes, and removes events 30 days after they end

## 🛠️ Tech Stack

Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Row Level Security) · Nodemailer (Gmail SMTP) · Vercel (hosting + cron) · Vitest + pgTAP

```
frontend/            Next.js app (the whole site)
  app/partners/      partner finder pages + server actions
  app/admin/         admin login + (protected) pages
  app/api/cron/      WSDC sync endpoint
  lib/wsdc/          WSDC page parser + sync logic
  scripts/           one-off MongoDB → Supabase import
supabase/
  migrations/        database schema, RLS policies, SQL functions
  tests/             pgTAP tests for access rules and registration
```

## 🚀 Local development

Requires Node 20+ and Docker (for local Supabase).

```bash
npx supabase start                 # local Postgres + Auth + email inbox at http://127.0.0.1:54324
cd frontend
cp .env.example .env.local         # fill in values printed by `supabase start`
npm install
npm run dev
```

Make yourself an admin locally:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "insert into admins (email) values ('you@example.com')"
```

Load WSDC events once:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-wsdc
```

## 🧪 Tests

```bash
cd frontend && npm test           # unit tests (parser, sync, queue, validation, admin)
npx supabase test db              # database tests (RLS, queue fairness, registration capacity)
```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details. **Note:** All images and visual assets are strictly prohibited from use without explicit permission.
