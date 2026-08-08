# 📁 Cấu Trúc Thư Mục Chi Tiết

> **Đọc xong tài liệu này bạn sẽ biết:** Từng file và folder trong project làm gì, tại sao nằm ở vị trí đó.

---

## Toàn Bộ Cấu Trúc

```
clinic-booking/
│
├── src/                          ← Toàn bộ source code nằm đây
│   ├── app/                      ← Next.js App Router (FE + BE)
│   ├── components/               ← React components tái sử dụng
│   ├── lib/                      ← Thư viện tiện ích (utilities)
│   └── middleware.ts             ← Chạy trước MỌI request
│
├── prisma.config.ts              ← Cấu hình Prisma CLI (schema + seed)
├── prisma/                       ← Cấu hình ORM Prisma
│   ├── schema.prisma             ← Định nghĩa cấu trúc database
│   ├── seed.ts                   ← Tạo dữ liệu mẫu
│   └── migrations/               ← Lịch sử thay đổi database
│
├── supabase/                     ← SQL migrations cho Supabase
│   └── migrations/               ← Policies và schema SQL thuần
│
├── docs/                         ← Tài liệu dự án (bạn đang đọc)
│
├── scripts/                      ← Scripts tiện ích
│   └── security-check.js         ← Kiểm tra bảo mật tự động
│
├── .env                          ← Biến môi trường (KHÔNG commit!)
├── .env.example                  ← Template .env cho người mới
├── package.json                  ← Dependencies và scripts
├── next.config.js                ← Cấu hình Next.js
├── tailwind.config.js            ← Cấu hình Tailwind CSS
├── tsconfig.json                 ← Cấu hình TypeScript
└── eslint.config.mjs             ← Cấu hình linting
```

---

## Chi Tiết: `src/app/` — Trái Tim Của Project

Đây là nơi quan trọng nhất. **Cấu trúc folder = cấu trúc URL**.

```
src/app/
│
├── layout.tsx                ← Layout gốc (bao quanh TẤT CẢ trang)
├── globals.css               ← CSS global (Tailwind imports)
├── page.tsx                  ← Trang gốc "/" → redirect sang /login
│
├── login/
│   └── page.tsx              ← /login — Trang đăng nhập
│
├── register/
│   └── page.tsx              ← /register — Trang đăng ký
│
├── dashboard/
│   └── page.tsx              ← /dashboard — Router: đọc role → redirect
│
├── book-appointment/
│   └── page.tsx              ← /book-appointment — Đặt lịch hẹn
│
├── my-appointments/
│   └── page.tsx              ← /my-appointments — Xem lịch của tôi
│
├── patient/                  ← Nhóm trang PATIENT
│   ├── layout.tsx            ← Layout chung cho patient pages
│   └── dashboard/
│       └── page.tsx          ← /patient/dashboard
│
├── doctor/                   ← Nhóm trang DOCTOR
│   ├── layout.tsx            ← Layout chung cho doctor pages
│   └── dashboard/
│       └── page.tsx          ← /doctor/dashboard
│
├── admin/                    ← Nhóm trang ADMIN
│   ├── layout.tsx            ← Layout chung cho admin pages
│   ├── dashboard/
│   │   └── page.tsx          ← /admin/dashboard
│   └── users/
│       ├── page.tsx          ← /admin/users — Danh sách users
│       ├── create/
│       │   └── page.tsx      ← /admin/users/create — Tạo user
│       └── [id]/
│           └── page.tsx      ← /admin/users/123 — Sửa user (dynamic route)
│
└── api/                      ← API endpoints (Backend!)
    ├── auth/
    │   ├── login/
    │   │   └── route.ts      ← POST /api/auth/login
    │   ├── register/
    │   │   └── route.ts      ← POST /api/auth/register
    │   └── callback/
    │       └── route.ts      ← GET /api/auth/callback (OAuth)
    ├── appointments/
    │   ├── route.ts          ← GET, POST /api/appointments
    │   └── [id]/
    │       └── route.ts      ← PATCH /api/appointments/:id
    ├── admin/
    │   └── appointments/
    │       └── [id]/
    │           └── route.ts  ← DELETE /api/admin/appointments/:id
    ├── doctors/
    │   └── route.ts          ← GET /api/doctors
    └── users/
        └── route.ts          ← POST /api/users
```

### Hiểu Dynamic Routes
```
admin/users/[id]/page.tsx  →  /admin/users/abc123
                                           ↑
                                  Giá trị id = "abc123"
                                  Lấy trong code: params.id
```

---

## Chi Tiết: `src/components/` — UI Components

```
src/components/
├── ThemeProvider.tsx       ← Context Provider quản lý theme toàn app
├── ThemeSwitcher.tsx       ← Auto-switch theme dựa theo URL hiện tại
├── HeroSection.tsx         ← Banner/Hero ở đầu các trang dashboard
├── AppointmentCard.tsx     ← Card hiển thị 1 lịch hẹn
├── AppointmentDetailModal.tsx  ← Modal xem chi tiết lịch hẹn
├── StatsCard.tsx           ← Card thống kê (tổng số, ...)
└── ConfirmDeleteModal.tsx  ← Modal xác nhận xóa
```

**Quy tắc:** Component nào dùng ở nhiều trang thì nằm đây. Không nên tạo component "one-off" cho 1 trang duy nhất vào đây.

---

## Chi Tiết: `src/lib/` — Utilities & Shared Code

```
src/lib/
├── supabase.ts     ← Khởi tạo Supabase client (singleton)
├── security.ts     ← Rate limiting, validation, sanitization
├── date-utils.ts   ← Format ngày tháng nhất quán
└── theme.ts        ← Định nghĩa màu sắc cho 3 themes
```

**Quy tắc:** Code không phải UI, không phải API logic → đặt vào đây để tái sử dụng.

---

## Chi Tiết: `src/middleware.ts` — Gác Cổng Của Ứng Dụng

```typescript
// Chạy TRƯỚC mọi request, cho mọi URL
export async function middleware(req: NextRequest) {
  // 1. Thêm security headers
  // 2. Refresh session nếu hết hạn
  // 3. Kiểm tra đăng nhập
  // 4. Kiểm tra quyền truy cập route
  // 5. Xử lý CORS cho API routes
}

// Áp dụng cho TẤT CẢ routes (trừ static files)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)']
}
```

Hãy nghĩ middleware như người bảo vệ ở cửa — mọi người đều phải qua đây trước khi vào.

---

## Chi Tiết: `prisma.config.ts` + `prisma/` — Database Schema

`prisma.config.ts` (root) là chỗ Prisma CLI đọc **đường dẫn schema, migrations, và lệnh seed**. Không dùng `package.json#prisma` nữa (deprecated, sẽ gỡ ở Prisma 7). File này `import 'dotenv/config'` vì khi có config thì Prisma **không** tự load `.env`. Connection URL vẫn nằm trong `schema.prisma` (`DATABASE_URL` / `DIRECT_URL`) — chuyển URL sang config là breaking của Prisma 7, project này giữ Prisma 6.

```
prisma.config.ts        ← CLI config: schema + migrations.seed
prisma/
├── schema.prisma       ← Khai báo models (bảng), relations, enums
├── seed.ts             ← Script tạo dữ liệu mẫu khi dev
└── migrations/
    └── 20250429142033_remove_doctor_table/
        └── migration.sql   ← SQL thực thi để thay đổi DB
```

**Quy trình thay đổi database:**
```
1. Sửa schema.prisma
2. Chạy: npx prisma migrate dev --name ten_thay_doi
3. Prisma tạo file SQL trong migrations/
4. Chạy migration lên DB
5. Tự động update TypeScript types
```

---

## Chi Tiết: `supabase/` — RLS (1 file canonical)

```
supabase/
├── migrations/
│   └── 20260808120000_rls_canonical.sql   ← CHẠY FILE NÀY (duy nhất)
└── archive/                               ← SQL lịch sử, không dùng khi setup
    ├── README.md
    ├── 20240320… / 20240321… / 20240424…
    └── 20260808000000_security_hardening.sql
```

Prisma tạo bảng; file canonical gắn RLS + grants + khoá `_prisma_migrations` + tắt `pg_graphql`.

> Xem giải thích: [🔒 RLS Policies](../database/rls-policies.md)

---

## Chi Tiết: File Cấu Hình

### `package.json` — Scripts quan trọng
```json
{
  "scripts": {
    "dev": "next dev",                          // Chạy dev server
    "build": "prisma generate && next build",  // Build production
    "start": "next start",                     // Chạy production server
    "seed": "prisma db seed",                  // Seed qua prisma.config.ts
    "security-check": "node scripts/security-check.js"  // Kiểm tra bảo mật
  }
}
```

### `next.config.js`
```javascript
const nextConfig = {
  reactStrictMode: true,           // Phát hiện bugs sớm
  eslint: { ignoreDuringBuilds: true }, // Bỏ qua lint khi build
  images: {
    remotePatterns: [...]           // Cho phép load ảnh từ Supabase
  }
}
```

### `tsconfig.json` — Path Alias
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]    // @/lib/supabase → src/lib/supabase
    }
  }
}
```

Nhờ path alias, thay vì viết:
```typescript
import { supabase } from '../../../lib/supabase'  // Xấu, dễ sai
```
Viết được:
```typescript
import { supabase } from '@/lib/supabase'  // Sạch, rõ ràng
```

---

## Sơ Đồ Phụ Thuộc Giữa Các Phần

```
                    middleware.ts
                         │
                    (kiểm tra auth)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   app/admin/       app/doctor/      app/patient/
   layout.tsx       layout.tsx       layout.tsx
        │                │                │
   (các pages)      (các pages)      (các pages)
        │                │                │
        └────────────────┼────────────────┘
                         │
                    app/api/*/
                    route.ts
                         │
                    ┌────┴────┐
               lib/           prisma/
           security.ts       schema.prisma
           supabase.ts
           date-utils.ts
```

---

**Tiếp theo:** [📊 Sơ Đồ Kiến Trúc →](./architecture-diagrams.md)
