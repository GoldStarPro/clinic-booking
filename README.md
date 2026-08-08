<div align="center">

# 🏥 Clinic Booking System

[![Next.js](https://img.shields.io/badge/Next.js-15.5.23-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A web application for managing clinic appointments.

[Documentation](./docs/README.md) · [Security](./docs/security/SECURITY.md) · [RLS Policies](./docs/database/rls-policies.md)

</div>

---

## Prerequisites

- Node.js (**v18 or higher**, recommended v20)
- npm (or yarn / pnpm)
- A [Supabase](https://supabase.com) account (Free tier is enough)
- PostgreSQL is provided by Supabase (no local Postgres required)

## Setup Instructions

Follow these steps on a **new machine** after cloning. Order matters (especially Auth admin → seed).

### 1. Clone the repository

```bash
git clone https://github.com/goldhoang/clinic-booking.git
cd clinic-booking
```

### 2. Install dependencies

```bash
npm install
```

### 3. Supabase project & Auth

1. Create a new project on [Supabase](https://supabase.com) (or reuse an existing one).
2. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server/seed only — never expose to the browser)
3. Go to **Project Settings → Database** and copy connection strings:
   - **Connection pooling (Transaction / port 6543)** → `DATABASE_URL`  
     Append `?pgbouncer=true` if it is not already present.
   - **Direct connection (port 5432)** → `DIRECT_URL`  
     Prisma migrate needs a direct (non-pooled) connection.
4. Go to **Authentication → Providers → Email**:
   - Enable **Email** provider
   - Disable **Confirm Email** (easier local login)
   - Disable **Secure Email Change**
   - Set **Minimum password length** ≥ **8**
   - *Prevent use of leaked passwords*: **Pro Plan only** — leave OFF on Free

### 4. Environment configuration

Copy the example file and fill in real values (do **not** commit `.env`):

```bash
cp .env.example .env
```

Update `.env`:

| Variable | Where to get it | Notes |
|----------|-----------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` | Public; limited by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` | **Secret.** Required for `npm run seed` |
| `DATABASE_URL` | Settings → Database → pooling URI | Prisma queries (PgBouncer) |
| `DIRECT_URL` | Settings → Database → direct URI | Prisma migrate |
| `NEXT_PUBLIC_APP_URL` | Your app origin | Default: `http://localhost:3000` (CORS) |
| `SEED_DOCTOR_PASSWORD` | You choose (≥ 8 chars) | Local seed only; **not** documented / committed |
| `SEED_PATIENT_PASSWORD` | You choose (≥ 8 chars) | Same as above |

Chi tiết từng biến: [docs/deployment/environment-variables.md](./docs/deployment/environment-variables.md).

### 5. Database setup (Prisma → RLS → seed)

**5.1. Generate client & create tables**

```bash
npx prisma generate

# First time / empty Supabase DB (recommended locally):
npx prisma db push

# Or apply committed Prisma migrations:
# npx prisma migrate deploy
```

**5.2. Row Level Security (exactly one SQL file)**

Open **Supabase → SQL Editor**, paste and **Run** the entire file:

- `supabase/migrations/20260808120000_rls_canonical.sql`

This single file enables RLS, locks `_prisma_migrations`, moves helpers to schema `private`, and drops `pg_graphql`. Older SQL lives under `supabase/archive/` — **do not run those** on a new setup.

Then: **Advisors → Security → Rerun linter**. Unused-index INFO on `Appointment` can be ignored.

**5.3. Create the admin Auth user (required before seed)**

Seed **keeps** `admin@clinic.com` and **does not change** its password. It will fail if that Auth user does not exist.

Create it once:

- Supabase Dashboard → **Authentication → Users → Add user** → email `admin@clinic.com` + a password you will remember, **or**
- Register/login once in the app with that email.

**5.4. Seed demo doctors / patients (optional)**

```bash
npm run seed
```

What seed does:

| Role | Emails | Auth |
|------|--------|------|
| Admin | `admin@clinic.com` | Kept as-is (your password) |
| Doctors (5) | `dr.*@clinic.com` | Created in Auth + `User` (same `id`) |
| Patients (3) | `*@gmail.com` | Same pairing (demo Auth accounts, not real Gmail) |
| Appointments | 4 sample rows | After profiles exist |

Seed prints emails only — **never** passwords. Set `SEED_DOCTOR_PASSWORD` / `SEED_PATIENT_PASSWORD` in `.env` yourself and remember them.

### 6. Run security check

```bash
npm run security-check
```

### 7. Start the development server

```bash
npm run dev
```

The application will be available at http://localhost:3000

Default dashboards after login (by `User.role`):

- `PATIENT` → `/patient/dashboard`
- `DOCTOR` → `/doctor/dashboard`
- `ADMIN` → `/admin/dashboard`

---

## 🔐 Security Updates Applied

This project addresses Dependabot CVEs (Next.js, PostCSS, …) and Supabase Security Advisor findings (RLS, GraphQL, Init Plan, SECURITY DEFINER exposure).

### Automated bots (merge-only workflow)
| Bot | What it does | Config |
|-----|----------------|--------|
| **Dependabot** | Mở PR khi npm/GitHub Actions có bản vá | `.github/dependabot.yml` |
| **Security Autofix** | Mỗi tuần chạy `npm audit fix` và tự mở PR | `.github/workflows/security-autofix.yml` |
| **Security Checks CI** | Fail PR nếu audit/RLS lint regress | `.github/workflows/security.yml` |

### Manual (Dashboard / SQL)
1. Chạy **`supabase/migrations/20260808120000_rls_canonical.sql`** (1 file duy nhất).
2. Password length ≥ 8. Leaked-password check chỉ trên Pro.
3. Advisors → Security → **Rerun linter**.

### Security Commands
```bash
npm audit --omit=dev
npm run security-check          # app checks + SQL RLS lint
npm run security-lint:sql       # chỉ lint Supabase migrations
npm outdated
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (seed + privileged server use only)
- `DATABASE_URL`: Pooled PostgreSQL URL (Prisma queries)
- `DIRECT_URL`: Direct PostgreSQL URL (Prisma migrate)
- `NEXT_PUBLIC_APP_URL`: Application origin (default: http://localhost:3000)
- `SEED_DOCTOR_PASSWORD` / `SEED_PATIENT_PASSWORD`: Local seed only (never commit)

## Features

- User authentication (login/register)
- User management
- Appointment booking
- Appointment management
- Dashboard for patients, doctors, admin

## Tech Stack

- Next.js 15.5.23 (Security Hardened)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth & Database)
- Prisma ORM
- PostgreSQL

## 🔒 Security Features

This application includes comprehensive security measures:
- ✅ **All GitHub Dependabot vulnerabilities fixed** (26+ CVEs patched)
- ✅ Security headers (XSS, Clickjacking, MIME-sniffing protection)
- ✅ Rate limiting on all API endpoints
- ✅ Input validation and sanitization
- ✅ CORS restrictions with whitelist
- ✅ Session-based authentication
- ✅ Role-based access control
- ✅ SQL injection protection via Prisma
- ✅ Supabase Row Level Security (canonical SQL migration)

For detailed security information, see [SECURITY.md](./docs/security/SECURITY.md). All project docs are in [docs/](./docs/).

## Project Structure

```
clinic-booking/
├── src/
│   ├── app/                 # Next.js App Router (pages + API)
│   │   ├── api/             # Route handlers (auth, appointments, doctors, admin)
│   │   ├── admin/           # Admin dashboards
│   │   ├── doctor/          # Doctor dashboards
│   │   ├── patient/         # Patient dashboards
│   │   ├── login/ register/
│   │   ├── book-appointment/
│   │   └── my-appointments/
│   ├── components/          # Theme, hydration gate, UI
│   ├── lib/                 # supabase, security, theme, dates
│   └── middleware.ts        # Auth gate + security headers
├── prisma.config.ts         # Prisma CLI (schema path + seed); not package.json#prisma
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts              # Auth + User seed (needs service role)
│   └── migrations/
├── supabase/
│   ├── migrations/          # Canonical RLS SQL (run in SQL Editor)
│   └── archive/             # Historical SQL — do not run on new setups
├── scripts/                 # security-check + SQL lint
├── docs/                    # Full project documentation (VI)
├── .github/                 # Dependabot + security workflows
├── public/
├── LICENSE                  # MIT
└── package.json
```

## API Endpoints

- `POST /api/auth/login` - Sign in (Supabase Auth + profile)
- `POST /api/auth/register` - Register (Auth + `User` row)
- `GET /api/doctors` - List doctors
- `GET /api/users` - Create/list users (admin flows)
- `GET /api/appointments` - Get user's appointments
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/[id]` - Update appointment status
- `PATCH /api/admin/appointments/[id]` - Admin appointment update

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](./LICENSE).

<div align="center">

---

### ✨ Built with ❤️ by **Tran Huy Hoang**

[![GitHub](https://img.shields.io/badge/GitHub-goldhoang-181717?style=for-the-badge&logo=github)](https://github.com/goldhoang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)
[![Docs](https://img.shields.io/badge/Docs-Read_me-4F46E5?style=for-the-badge&logo=readthedocs&logoColor=white)](./docs/README.md)
[![Security](https://img.shields.io/badge/Security-Handbook-059669?style=for-the-badge&logo=shieldsdotio&logoColor=white)](./docs/security/SECURITY.md)

**Clinic Booking** · Fullstack appointment system · © 2026 Gold Hoang

[github.com/goldhoang/clinic-booking](https://github.com/goldhoang/clinic-booking)

</div>
