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
   # Apply migration schema Prisma
   npx prisma migrate dev

   # Generate Prisma Client
   npx prisma generate

   # Push the schema to your database
   npx prisma db push

   # Seed the database with initial data
   npx prisma db seed

   - Go to SQL Editor on Supabase
     - Copy and paste the contents of `supabase\migrations\20240424000000_update_schema.sql`
     - Run the SQL script to set up all necessary policies and permissions
   ```

6. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

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

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Prisma
- PostgreSQL

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
