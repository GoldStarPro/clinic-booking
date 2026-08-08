# Clinic Booking System

A web application for managing clinic appointments.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- PostgreSQL database

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clinic-booking.git
```

2. Install dependencies:
```bash
   npm install
```

3. Supabase Setup:
   - Create a new project on [Supabase](https://supabase.com)
   - Go to Project Settings > API to get your project URL and anon key
   - Go to Authentication > Providers
     - Enable Email provider
     - Disable "Confirm Email"
     - Disable "Secure Email Change"

4. Environment Configuration:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update the following values in `.env` with your Supabase project credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `DATABASE_URL`: Your PostgreSQL database URL
     - `DIRECT_URL`: Your direct database URL (same as DATABASE_URL for local development)

5. Database Setup:
   ```bash
   # Tạo bảng (Prisma)
   npx prisma migrate deploy
   # hoặc lần đầu / local: npx prisma db push

   npx prisma generate
   npx prisma db seed
   ```

   Sau đó mở **Supabase → SQL Editor**, chạy **đúng 1 file**:
   - `supabase/migrations/20260808120000_rls_canonical.sql`

   Auth → Providers → Email:
   - Minimum password length ≥ **8**
   - *Prevent use of leaked passwords*: chỉ có trên **Pro** — Free bỏ qua

6. Run security check:
```bash
npm run security-check
```

7. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

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
- `DATABASE_URL`: Your PostgreSQL database URL
- `DIRECT_URL`: Your direct database URL
- `NEXT_PUBLIC_APP_URL`: Your application URL (default: http://localhost:3000)

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

For detailed security information, see [SECURITY.md](./docs/security/SECURITY.md). All project docs are in [docs/](./docs/).

## Project Structure

```
clinic-booking/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/             # API routes
│   │   ├── book-appointment # Booking page
│   │   ├── my-appointments  # Appointments page
│   │   └── page.tsx         # Home page
│   └── lib/                 # Utility functions
├── prisma/                  # Prisma schema and migrations
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

## API Endpoints

- `GET /api/doctors` - Get list of doctors
- `GET /api/appointments` - Get user's appointments
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/[id]` - Update appointment status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
