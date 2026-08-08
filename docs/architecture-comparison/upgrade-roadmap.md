# 📈 Lộ Trình Nâng Cấp Project

> **Đọc xong tài liệu này bạn sẽ biết:** Các hướng mở rộng để nâng cấp project lên chuẩn production, từ dễ đến khó.

---

## Tổng Quan Lộ Trình

```
Hiện tại                    Tương lai gần               Tương lai xa
(MVP)                       (Production-ready)          (Enterprise)
   │                               │                          │
   ▼                               ▼                          ▼
Next.js Fullstack    →    Cải thiện trong Next.js    →  Tách BE/FE riêng
Supabase + Prisma         + Redis + Testing              + Microservices
Vercel Free               + CI/CD + Monitoring            + K8s
```

---

## Mức 1: Cải Thiện Ngay (Dễ, Không Cần Thay Đổi Kiến Trúc)

### 1.1 Thay Rate Limiting In-Memory → Redis

**Vấn đề hiện tại:**
```typescript
// Hiện tại: Map trong RAM → reset khi server restart (cold start)
const rateLimitMap = new Map<string, {...}>()
```

**Giải pháp:** Dùng [Upstash Redis](https://upstash.com) (free tier có sẵn):

```typescript
// Cài: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),  // 10 requests/minute
})

// Trong API route:
const { success } = await ratelimit.limit(clientIP)
if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
```

**Lợi ích:** Rate limit persist qua các serverless invocations.

---

### 1.2 Thêm Content Security Policy (CSP)

**Thêm vào `next.config.js`:**
```javascript
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Cần cho Next.js
            "style-src 'self' 'unsafe-inline'",
            `img-src 'self' data: https://*.supabase.co`,
            "connect-src 'self' https://*.supabase.co",
          ].join('; ')
        }
      ]
    }
  ]
}
```

---

### 1.3 Thêm Error Boundary & Loading States

```typescript
// app/error.tsx — Global error handler
'use client'
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Đã có lỗi xảy ra</h2>
      <button onClick={reset}>Thử lại</button>
    </div>
  )
}

// app/loading.tsx — Loading UI
export default function Loading() {
  return <div className="animate-spin">...</div>
}
```

---

### 1.4 Validation Mạnh Hơn với Zod

```typescript
// Thay vì validation thủ công, dùng Zod schema
import { z } from 'zod'

const AppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().refine(d => new Date(d) >= new Date(), 'Ngày phải là tương lai'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  symptoms: z.string().min(3).max(500),
  notes: z.string().max(1000).optional(),
})

// Dùng:
const result = AppointmentSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json({ errors: result.error.issues }, { status: 400 })
}
```

---

### 1.5 Database Connection Tốt Hơn (Prisma Singleton)

**Vấn đề:** Mỗi API route import tạo PrismaClient mới → waste connections.

```typescript
// lib/prisma.ts — Singleton pattern
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Dùng trong mọi nơi:
import { prisma } from '@/lib/prisma'
```

---

## Mức 2: Tính Năng Mới (Trung Bình)

### 2.1 Hệ Thống Thông Báo (Notifications)

```
Lịch hẹn được xác nhận → Gửi email thông báo cho bệnh nhân
Lịch hẹn sắp tới (1 ngày trước) → Gửi reminder
```

**Công nghệ:** [Resend](https://resend.com) (email API đơn giản):

```typescript
// Cài: npm install resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'clinic@example.com',
  to: patient.email,
  subject: 'Lịch hẹn của bạn đã được xác nhận',
  html: `<p>Lịch hẹn với Dr. ${doctor.name} vào ${date} lúc ${time} đã được xác nhận.</p>`
})
```

---

### 2.2 Real-time Updates (Không cần reload trang)

**Công nghệ:** Supabase Realtime (đã built-in):

```typescript
// Lắng nghe thay đổi trong bảng Appointment
const channel = supabase
  .channel('appointments')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'Appointment' },
    (payload) => {
      // Cập nhật UI ngay khi status thay đổi
      setAppointments(prev => 
        prev.map(a => a.id === payload.new.id ? payload.new : a)
      )
    }
  )
  .subscribe()
```

---

### 2.3 Upload Ảnh Đại Diện

**Công nghệ:** Supabase Storage:

```typescript
// Upload ảnh
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file)

// Lấy URL public
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)

// Lưu URL vào database
await prisma.user.update({
  where: { id: userId },
  data: { image: publicUrl }
})
```

---

### 2.4 Tìm Kiếm & Lọc Nâng Cao

```typescript
// Lọc bác sĩ theo chuyên khoa + tìm kiếm theo tên
const doctors = await prisma.user.findMany({
  where: {
    role: 'DOCTOR',
    AND: [
      specialty ? { specialty: { contains: specialty, mode: 'insensitive' } } : {},
      search ? { name: { contains: search, mode: 'insensitive' } } : {},
    ]
  },
  orderBy: { name: 'asc' }
})
```

---

## Mức 3: Nâng Cấp Kiến Trúc (Khó, Dài Hạn)

### 3.1 Tách Backend Riêng (NestJS)

**Khi nào nên tách?**
- Team có BE developer riêng
- Cần mobile app (React Native/Flutter)
- Logic backend phức tạp hơn
- Cần WebSocket thực sự

**Bước thực hiện:**

```
Bước 1: Tạo NestJS project
  npm new clinic-api

Bước 2: Move logic từ Next.js API routes sang NestJS
  src/app/api/appointments/route.ts
  → clinic-api/src/appointments/appointments.controller.ts

Bước 3: Cấu hình Next.js gọi external API
  NEXT_PUBLIC_API_URL=https://clinic-api.railway.app

Bước 4: Deploy BE riêng (Railway/Render)
  git push → Railway auto deploy

Bước 5: Update CORS trong NestJS BE
  app.enableCors({ origin: 'https://clinic.vercel.app' })
```

---

### 3.2 Thêm Testing

```typescript
// Unit test với Jest + Testing Library
// __tests__/security.test.ts
import { isValidEmail, isValidUUID, checkRateLimit } from '@/lib/security'

describe('Email Validation', () => {
  it('should accept valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })
  
  it('should reject invalid email', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
  })
})

// E2E test với Playwright
// e2e/booking.spec.ts
test('Patient can book appointment', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'patient@test.com')
  await page.fill('[name=password]', 'password')
  await page.click('[type=submit]')
  await expect(page).toHaveURL('/patient/dashboard')
  // ...
})
```

---

### 3.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
```

---

### 3.4 Monitoring & Observability

```typescript
// Thêm error tracking với Sentry
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})

// Tự động catch unhandled errors
// Trong API route:
try {
  // ...
} catch (error) {
  Sentry.captureException(error)
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}
```

---

## Bảng Tổng Hợp Nâng Cấp

| Hạng mục | Độ ưu tiên | Độ khó | Thời gian |
|----------|-----------|--------|-----------|
| Redis rate limiting | Cao | Thấp | 2 giờ |
| Zod validation | Cao | Thấp | 4 giờ |
| Prisma singleton | Cao | Thấp | 30 phút |
| Email notifications | Trung | Trung | 1 ngày |
| Realtime updates | Trung | Trung | 1 ngày |
| Image upload | Thấp | Trung | 4 giờ |
| Unit testing | Cao | Trung | 3 ngày |
| CI/CD pipeline | Trung | Trung | 1 ngày |
| Tách BE riêng | Thấp | Cao | 1-2 tuần |
| Monitoring | Trung | Thấp | 4 giờ |

---

**Tiếp theo:** [🔨 Tự Xây Dự Án Tương Tự →](../getting-started/build-from-scratch.md)
