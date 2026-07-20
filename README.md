# Opportunity Radar

**AI-powered Opportunity Intelligence Platform for students.**

Create a profile once. Continuously discover research internships, scholarships, fellowships, summer schools, hackathons, and more from top universities and labs. Get eligibility checks, ranked recommendations, and deadline alerts — never miss an opportunity again.

---

## Features

- **Premium landing page** with dark/light mode
- **Auth**: email/password, Google OAuth, password reset, email verification, JWT sessions
- **Academic profiles** with completion scoring, resume upload, skills & research interests
- **Personalized dashboard**: Recommended, Closing Soon, by category, AI insights
- **Opportunity feed** with match scores, eligibility, bookmarks, apply tracking
- **Global search** + advanced filters + search history
- **Institution pages** with stats, research areas, current/past opportunities, crawl status
- **Recommendation engine** (eligibility, profile, research, skills, popularity, funding, prestige, deadline, freshness)
- **Eligibility engine** (Eligible / Likely / Possibly / Not Eligible + reasons)
- **Crawler system** with jobs, logs, dedupe, admin trigger
- **Notifications** (in-app + email) for deadlines and new matches
- **Admin portal**: analytics, crawler health, user list, job logs
- **Security**: rate limiting, validation (Zod), RBAC, secure headers, secure uploads
- **Docker + CI-ready**

---

## Quick start

```bash
cd opportunity-radar
npm install
npm run setup    # generate client, push schema, seed 50+ institutions & 500+ opportunities
npm run dev      # http://localhost:3000
```

### Demo accounts

| Role  | Email                         | Password       |
|-------|-------------------------------|----------------|
| Demo  | `demo@opportunityradar.app`    | `Password123!` |
| Admin | `admin@opportunityradar.app`   | `Password123!` |

---

## Environment

Copy `.env.example` → `.env` (a working `.env` is included for local SQLite).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite `file:./dev.db` or Postgres URL |
| `AUTH_SECRET` | JWT secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google OAuth |
| `SMTP_*` | Production email (console transport in dev) |
| `CRON_SECRET` | Secure `/api/cron` background jobs |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run setup` | DB push + seed |
| `npm run db:seed` | Re-seed data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Wipe + reseed |

---

## Architecture

```
src/
  app/                 # Next.js App Router (pages + API)
  components/          # UI, layout, opportunity cards
  lib/
    auth/              # NextAuth (JWT + credentials + Google)
    crawler/           # Job runner, sources, normalize/dedupe
    engines/           # Eligibility, recommendation, notifications
    db.ts              # Prisma client
    email.ts           # Dev console + SMTP
    rate-limit.ts      # DB-backed rate limiting
prisma/
  schema.prisma        # Full relational schema
  seed.ts              # 50+ institutions, 500+ opportunities
```

### Cron / background jobs

```
GET /api/cron?task=all|crawl|deadlines|matches
Header: x-cron-secret: <CRON_SECRET>
```

Schedule every 6 hours in production (Vercel Cron, GitHub Actions, or system cron).

---

## Docker

```bash
docker compose up --build
```

App listens on `http://localhost:3000`.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Prisma 5** · **SQLite** (dev) / **PostgreSQL** (prod-ready)
- **NextAuth v5** · **Zod** · **Tailwind CSS 4**
- **bcryptjs** · **date-fns** · **lucide-react** · **sonner** · **next-themes**

---

## License

Private — built as a production SaaS reference implementation.
