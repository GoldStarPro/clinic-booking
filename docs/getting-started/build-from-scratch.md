# 🔨 Tự Xây Dự Án Tương Tự Từ Đầu

> **Đọc xong tài liệu này bạn sẽ biết:** Cách tự xây một dự án fullstack Next.js + Supabase từ con số 0, step-by-step.

---

## Tổng Quan

Đây là hướng dẫn recreate project Clinic Booking (hoặc dự án tương tự) từ đầu. Sau khi đọc toàn bộ tài liệu này, bạn có thể áp dụng để tự xây bất kỳ dự án CRUD fullstack nào.

**Thời gian ước tính:** 3-5 ngày (nếu làm full-time)

---

## Phase 1: Setup Môi Trường (2-3 giờ)

### Bước 1: Cài đặt tools cần thiết

```bash
# Node.js (version 18+)
# Tải từ: https://nodejs.org

# Kiểm tra version
node --version  # >= 18
npm --version   # >= 9

# Git
git --version
```

### Bước 2: Tạo project Next.js

```bash
# Tạo project với TypeScript + Tailwind + App Router
npx create-next-app@latest clinic-booking \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd clinic-booking
```

### Bước 3: Cài dependencies

```bash
# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Prisma
npm install @prisma/client
npm install -D prisma ts-node

# Utilities
npm install uuid
npm install -D @types/uuid
```

### Bước 4: Tạo Supabase Project

1. Đăng ký tài khoản [supabase.com](https://supabase.com)
2. "New Project" → Đặt tên, chọn region (Singapore gần VN nhất)
3. Đợi 2-3 phút để khởi tạo
4. Vào Settings → API → Copy các keys

### Bước 5: Setup file `.env`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## Phase 2: Database Setup (3-4 giờ)

### Bước 6: Khởi tạo Prisma

```bash
npx prisma init
```

Sẽ tạo ra:
- `prisma/schema.prisma`
- `.env` (thêm DATABASE_URL vào)

### Bước 7: Viết Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id          String    @id @default(uuid())
  email       String    @unique
  name        String
  role        Role      @default(PATIENT)
  phone       String?
  specialty   String?
  description String?
  image       String?
  patientAppointments Appointment[] @relation("PatientAppointments")
  doctorAppointments  Appointment[] @relation("DoctorAppointments")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Appointment {
  id        String   @id @default(uuid())
  patientId String
  doctorId  String
  date      DateTime
  time      String
  status    Status   @default(PENDING)
  symptoms  String?
  notes     String?
  patient   User     @relation("PatientAppointments", fields: [patientId], references: [id])
  doctor    User     @relation("DoctorAppointments", fields: [doctorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([patientId])
  @@index([doctorId])
}

enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum Status {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

### Bước 8: Chạy Migration

```bash
# Tạo và chạy migration đầu tiên
npx prisma migrate dev --name initial_schema

# Generate Prisma Client
npx prisma generate
```

### Bước 9: Setup RLS Policies trên Supabase

Vào Supabase Dashboard → SQL Editor → Chạy:

```sql
-- Bật RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

-- User: service_role full access
CREATE POLICY "Service role bypass" ON "User"
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User: public insert (đăng ký)
CREATE POLICY "Anyone can register" ON "User"
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- User: xem bác sĩ công khai
CREATE POLICY "Public can see doctors" ON "User"
FOR SELECT TO anon, authenticated
USING (role = 'DOCTOR'::"Role");

-- User: quản lý data của mình
CREATE POLICY "Own data" ON "User"
FOR ALL TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Appointment: service_role full access
CREATE POLICY "Service role bypass" ON "Appointment"
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Appointment: tạo lịch hẹn
CREATE POLICY "Patient can create" ON "Appointment"
FOR INSERT TO authenticated
WITH CHECK ("patientId" = auth.uid()::text);

-- Appointment: xem lịch của mình
CREATE POLICY "Own appointments" ON "Appointment"
FOR SELECT TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text);

-- Appointment: cập nhật lịch của mình
CREATE POLICY "Update own" ON "Appointment"
FOR UPDATE TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text);
```

---

## Phase 3: Core Code (2-3 ngày)

### Bước 10: Tạo Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
)
```

### Bước 11: Tạo Middleware

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')

  // Refresh session
  await supabase.auth.getSession()

  const path = req.nextUrl.pathname
  const publicPaths = ['/login', '/register', '/']
  
  if (publicPaths.includes(path)) return res

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  // Role-based routing
  const { data: user } = await supabase
    .from('User').select('role').eq('id', session.user.id).single()

  if (path.startsWith('/admin') && user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (path.startsWith('/doctor') && user?.role !== 'DOCTOR') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)']
}
```

### Bước 12: Tạo Security Utilities

```typescript
// src/lib/security.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(id: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(id)
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(id, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (entry.count >= limit) return true
  entry.count++
  return false
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>]/g, '').trim().substring(0, 1000)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
}

export function getClientIP(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
}
```

### Bước 13: Tạo API Routes

**Auth - Register:**
```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PrismaClient } from '@prisma/client'
import { checkRateLimit, getClientIP, isValidEmail, sanitizeString } from '@/lib/security'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const ip = getClientIP(req.headers)
  if (checkRateLimit(ip, 5, 300000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { email, password, name, role } = await req.json()

  if (!isValidEmail(email) || !password || password.length < 8 || !name) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const user = await prisma.user.create({
    data: {
      id: data.user!.id,
      email,
      name: sanitizeString(name),
      role: role || 'PATIENT',
    }
  })

  return NextResponse.json({ user }, { status: 201 })
}
```

**Appointments:**
```typescript
// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  
  const where = user?.role === 'PATIENT' 
    ? { patientId: session.user.id }
    : user?.role === 'DOCTOR'
    ? { doctorId: session.user.id }
    : {}  // Admin: all
  
  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      doctor: { select: { name: true, specialty: true, image: true } },
      patient: { select: { name: true, phone: true } }
    },
    orderBy: { date: 'desc' }
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { doctorId, date, time, symptoms, notes } = await req.json()

  const appointment = await prisma.appointment.create({
    data: {
      patientId: session.user.id,  // Từ session, không từ input!
      doctorId,
      date: new Date(date),
      time,
      symptoms,
      notes: notes || '',
      status: 'PENDING'
    }
  })

  return NextResponse.json(appointment, { status: 201 })
}
```

### Bước 14: Tạo Pages

**Login page:**
```typescript
// src/app/login/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      return
    }
    
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow w-96">
        <h1 className="text-2xl font-bold mb-6">Đăng nhập</h1>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border p-2 rounded mb-4"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border p-2 rounded mb-6"
          required
        />
        
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Đăng nhập
        </button>
      </form>
    </div>
  )
}
```

---

## Phase 4: Deploy (1-2 giờ)

### Bước 15: Push lên GitHub

```bash
git init
git add .
git commit -m "Initial clinic booking app"
git remote add origin https://github.com/username/clinic-booking.git
git push -u origin main
```

### Bước 16: Deploy lên Vercel

1. Truy cập [vercel.com](https://vercel.com)
2. Import from GitHub
3. Thêm Environment Variables (copy từ .env)
4. Deploy!

---

## Checklist Hoàn Thành

### Core Features
- [ ] Đăng ký / Đăng nhập
- [ ] Middleware bảo vệ routes
- [ ] Bệnh nhân đặt lịch hẹn
- [ ] Bệnh nhân xem/hủy lịch
- [ ] Bác sĩ xem và cập nhật lịch
- [ ] Admin xem tất cả, xóa lịch
- [ ] Admin quản lý users

### Database
- [ ] Schema Prisma
- [ ] Migration chạy thành công
- [ ] RLS Policies được apply

### Security
- [ ] Rate limiting
- [ ] Input validation
- [ ] Security headers
- [ ] Environment variables không bị expose

### UI
- [ ] Responsive (mobile-friendly)
- [ ] Loading states
- [ ] Error messages rõ ràng

---

## Công Thức Tổng Quát

Dựa vào project này, bạn có thể xây **bất kỳ dự án CRUD** nào theo công thức:

```
1. Next.js (FE + BE) + TypeScript
2. Supabase (Auth + Database + Storage)
3. Prisma (ORM - query database)
4. Tailwind CSS (styling)
5. Middleware (protection)
6. API Routes (/api/*) với validation
7. Vercel (deploy)
```

**Ví dụ áp dụng:**
- Restaurant booking → đổi Appointment thành Reservation, Doctor thành Restaurant
- Library management → đổi Appointment thành BookLoan, Doctor thành Librarian
- Hotel booking → đổi Appointment thành RoomReservation, Doctor thành Hotel

---

> **Chúc mừng!** Nếu bạn đọc đến đây, bạn đã hiểu toàn bộ project Clinic Booking từ A-Z.
> Hãy bắt đầu tự xây một dự án nhỏ để thực hành — đó là cách học hiệu quả nhất!
