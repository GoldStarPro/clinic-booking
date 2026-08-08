# 🔄 Tại Sao Dùng Cả Supabase VÀ Prisma?

> **Câu hỏi được giải đáp:** *"Cả 2 đều liên quan đến database, vậy mỗi cái làm gì? Tại sao không dùng 1 cái thôi?"*

---

## 1. Tóm Tắt Nhanh

```
┌─────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                        │
│                                                         │
│  Supabase          ─────────────────────────────────── │
│  - Cung cấp PostgreSQL database (cloud)                 │
│  - Xử lý Authentication (đăng nhập, session)           │
│  - Cung cấp RLS (Row Level Security)                    │
│  - Dashboard quản lý data trực quan                     │
│                                                         │
│  Prisma            ─────────────────────────────────── │
│  - Kết nối đến database của Supabase                   │
│  - Viết query TypeScript thay vì SQL                    │
│  - Type-safe (tránh lỗi kiểu dữ liệu)                 │
│  - Quản lý migration schema                            │
└─────────────────────────────────────────────────────────┘
```

**Một câu:** Supabase = **hạ tầng** (đám mây), Prisma = **công cụ** để code tương tác với hạ tầng đó.

---

## 2. Supabase Làm Gì?

### Supabase là Backend as a Service (BaaS)

Supabase cung cấp sẵn:
1. **PostgreSQL Database** — không cần tự cài đặt, tự maintain
2. **Authentication** — đăng nhập email/password, OAuth (Google, GitHub...)
3. **Row Level Security** — bảo mật ở tầng database
4. **Storage** — lưu file (chưa dùng trong project)
5. **Realtime** — WebSocket (chưa dùng)
6. **Dashboard** — giao diện web để quản lý data

### Trong project này, Supabase xử lý Authentication:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // URL project Supabase
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Public key
  {
    auth: {
      persistSession: true,      // Lưu session qua reload trang
      autoRefreshToken: true,    // Tự refresh token hết hạn
      detectSessionInUrl: true   // Xử lý OAuth callback
    }
  }
)
```

```typescript
// Đăng nhập qua Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
// data.session chứa JWT token
// data.user chứa thông tin user từ Supabase Auth
```

### Middleware đọc session từ Supabase:

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res })
  
  // Tự động refresh session nếu token hết hạn
  await supabase.auth.getSession()
  
  // Kiểm tra user đã đăng nhập chưa
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Redirect về login
  }
}
```

---

## 3. Prisma Làm Gì?

### Prisma là ORM (Object-Relational Mapping)

Prisma giúp code TypeScript nói chuyện với database PostgreSQL:

```typescript
// KHÔNG có Prisma — viết SQL thuần (dễ lỗi, không type-safe)
const result = await db.query(`
  SELECT u.name, u.specialty, a.date, a.time, a.status
  FROM "Appointment" a
  JOIN "User" u ON u.id = a."doctorId"
  WHERE a."patientId" = $1
  ORDER BY a.date DESC
`, [userId])
// result.rows có type là any[] → không biết structure

// CÓ Prisma — TypeScript type-safe
const appointments = await prisma.appointment.findMany({
  where: { patientId: userId },
  include: {
    doctor: {
      select: { name: true, specialty: true }
    }
  },
  orderBy: { date: 'desc' }
})
// appointments có type Appointment[] với đầy đủ types!
```

### Prisma Client — Auto-generated từ Schema

Khi chạy `prisma generate`, Prisma đọc `schema.prisma` và tạo ra TypeScript client:

```typescript
// prisma/schema.prisma định nghĩa:
model Appointment {
  id     String @id
  status Status
  // ...
}

// → Prisma tạo ra type:
type Appointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  // ...
}

// → IDE biết chính xác type khi bạn code:
const appt = await prisma.appointment.findFirst(...)
appt.status  // IDE gợi ý: 'PENDING' | 'CONFIRMED' | ...
```

### Prisma trong API Routes:

```typescript
// src/app/api/appointments/route.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Lấy appointments kèm thông tin bác sĩ
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: session.user.id
    },
    include: {
      doctor: {
        select: { name: true, specialty: true, image: true }
      }
    },
    orderBy: { date: 'desc' }
  })
  
  return NextResponse.json(appointments)
}
```

---

## 4. Cách Prisma Kết Nối Với Supabase

```
Prisma ──── DATABASE_URL ────► Supabase PostgreSQL
```

Trong `.env`:
```env
# Pooled connection (dùng connection pooler của Supabase)
# Phù hợp cho Serverless (Vercel) - nhiều requests, connection được tái dùng
DATABASE_URL="postgresql://postgres.xxxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (kết nối thẳng không qua pooler)
# Dùng cho prisma migrate (cần persistent connection)
DIRECT_URL="postgresql://postgres.xxxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Dùng khi query (pooled)
  directUrl = env("DIRECT_URL")     // Dùng khi migrate (direct)
}
```

**Tại sao cần 2 URL?**
- `DATABASE_URL` (pooled): Vercel/Serverless có nhiều function instances, cần connection pooling để không quá tải database
- `DIRECT_URL`: Prisma migrate cần giữ connection lâu dài, không dùng được pooler

---

## 5. Supabase Auth vs Prisma Database — Phân Vai Rõ Ràng

```
Khi đăng ký tài khoản:
┌─────────────────────────────────────────────┐
│                                              │
│  1. Supabase Auth tạo auth user             │
│     (bảng auth.users - hệ thống của Supabase)│
│     → Quản lý password, session, JWT        │
│                                              │
│  2. Prisma tạo user profile                 │
│     (bảng public.User - của chúng ta)       │
│     → Quản lý name, role, specialty,...     │
└─────────────────────────────────────────────┘

Lưu ý: 2 bảng này dùng cùng ID (UUID)!
auth.users.id = public.User.id
```

Đây là điều quan trọng: Supabase Auth có bảng `auth.users` riêng của nó (bạn không quản lý trực tiếp). Project tạo thêm bảng `public.User` để lưu thêm thông tin như role, specialty...

---

## 6. Khi Nào Dùng Supabase Client vs Prisma?

| Tình huống | Dùng gì | Ví dụ |
|-----------|---------|-------|
| Đăng nhập | Supabase Auth | `supabase.auth.signIn()` |
| Đăng xuất | Supabase Auth | `supabase.auth.signOut()` |
| Đọc session | Supabase Auth | `supabase.auth.getSession()` |
| Middleware | Supabase Auth helpers | `createMiddlewareClient()` |
| Query data | Prisma | `prisma.user.findMany()` |
| Tạo record | Prisma | `prisma.appointment.create()` |
| Cập nhật | Prisma | `prisma.appointment.update()` |
| Xóa | Prisma | `prisma.appointment.delete()` |
| Migration | Prisma CLI | `prisma migrate dev` |

---

## 7. Có Thể Không Dùng Prisma Không?

Có! Supabase có client JS riêng để query database:

```typescript
// Cách dùng Supabase client để query (không cần Prisma)
const { data, error } = await supabase
  .from('Appointment')
  .select(`
    *,
    doctor:User!doctorId(name, specialty)
  `)
  .eq('patientId', userId)
```

**Nhưng tại sao project chọn Prisma?**

| | Supabase JS Client | Prisma |
|--|-------------------|--------|
| Type safety | Yếu (cần tự khai báo type) | Mạnh (tự sinh từ schema) |
| Code gợi ý | Hạn chế | Rất tốt |
| Complex queries | Khó (phải biết PostgREST syntax) | Dễ hơn |
| Migration | Không có | Có (tự tạo SQL) |
| Relations | Phức tạp | Đơn giản (`include`) |

**Kết luận:** Prisma tốt hơn về DX (Developer Experience) cho dự án TypeScript phức tạp.

---

## 8. Tóm Tắt

```
Supabase = "Thuê nhà ở" (hạ tầng cloud)
Prisma   = "Chìa khóa và sơ đồ nhà" (công cụ truy cập)

Cả 2 phối hợp:
- Supabase lo phần Auth + Database hosting
- Prisma lo phần "nói chuyện với database" một cách an toàn, dễ dàng
```

---

**Tiếp theo:** [🔐 Luồng Xác Thực →](../auth-and-authorization/authentication-flow.md)
