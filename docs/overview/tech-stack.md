# 🛠️ Công Nghệ Sử Dụng

> **Đọc xong tài liệu này bạn sẽ biết:** Từng thư viện/công nghệ trong project là gì, làm gì, tại sao chọn nó.

---

## Tổng Quan Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CLINIC BOOKING                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FRONTEND (Giao diện)                   │   │
│  │  React 19  |  Next.js 15  |  Tailwind CSS           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              BACKEND (API & Logic)                  │   │
│  │  Next.js API Routes  |  Prisma ORM  |  TypeScript   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               EXTERNAL SERVICES                     │   │
│  │  Supabase Auth  |  Supabase PostgreSQL              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  DEPLOYMENT                         │   │
│  │                    Vercel                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Next.js 15 — Framework Chính

**Phiên bản:** 15.5.12  
**Website:** https://nextjs.org

### Next.js là gì?
Next.js là một **React framework** — tức là nó xây dựng trên React và bổ sung thêm nhiều tính năng mạnh mẽ:

| Tính năng | React thuần | Next.js |
|-----------|-------------|---------|
| Routing | Tự cài thêm React Router | Built-in, dựa theo folder |
| Server-side rendering | Không có | Có sẵn |
| API endpoints | Không có | Có sẵn (API Routes) |
| Tối ưu hình ảnh | Không có | Có sẵn |
| SEO | Khó | Dễ |

### App Router (Next.js 13+)
Project này dùng **App Router** — kiến trúc định tuyến mới nhất của Next.js:
- Mỗi folder trong `src/app/` → tạo ra 1 URL
- File `page.tsx` → là trang hiển thị cho user
- File `route.ts` → là API endpoint
- File `layout.tsx` → layout bao quanh các trang con

**Ví dụ:**
```
src/app/
├── login/
│   └── page.tsx        → URL: /login
├── admin/
│   ├── layout.tsx      → Layout cho tất cả trang /admin/*
│   └── dashboard/
│       └── page.tsx    → URL: /admin/dashboard
└── api/
    └── appointments/
        └── route.ts    → API endpoint: /api/appointments
```

### React Strict Mode
Được bật trong `next.config.js` để phát hiện lỗi tiềm ẩn trong development.

---

## 2. React 19 — UI Library

**Phiên bản:** 19.x  
**Website:** https://react.dev

React là thư viện JavaScript để xây dựng giao diện người dùng. Project này dùng các tính năng React hiện đại:

- **Server Components** (mặc định trong App Router): Component chạy trên server, không gửi JavaScript về client
- **Client Components** (`'use client'`): Component chạy trên browser, dùng khi cần tương tác
- **Hooks**: `useState`, `useEffect`, `useContext` để quản lý state

---

## 3. TypeScript — Ngôn Ngữ Lập Trình

**Phiên bản:** 5.x  
**Website:** https://www.typescriptlang.org

TypeScript = JavaScript + **kiểu dữ liệu tĩnh**. Nghĩa là bạn phải khai báo kiểu dữ liệu cho biến, tham số, kết quả hàm.

**Tại sao dùng TypeScript thay vì JavaScript thuần?**
```typescript
// JavaScript thuần - không biết user có gì
function greet(user) {
  return user.name  // Có thể lỗi nếu user.name không tồn tại
}

// TypeScript - rõ ràng, an toàn
interface User {
  name: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN'
}
function greet(user: User) {
  return user.name  // IDE biết chắc user có name
}
```

**Lợi ích trong project:**
- Phát hiện lỗi ngay khi code, không cần chạy mới biết
- IDE gợi ý code thông minh hơn
- Dễ đọc, dễ maintain

---

## 4. Tailwind CSS — Styling

**Phiên bản:** 3.4.17  
**Website:** https://tailwindcss.com

Tailwind CSS là framework CSS theo hướng **utility-first** — thay vì viết file `.css` riêng, bạn dùng các class sẵn có trực tiếp trong HTML/JSX.

**So sánh:**
```html
<!-- CSS truyền thống -->
<div class="card">...</div>
<!-- Trong file .css: .card { background: white; padding: 16px; ... } -->

<!-- Tailwind CSS -->
<div class="bg-white p-4 rounded-lg shadow">...</div>
<!-- Không cần file CSS riêng! -->
```

**Trong project này:**
- `bg-indigo-600` → nền tím cho Admin theme
- `bg-sky-600` → nền xanh cho Doctor theme
- `bg-pink-600` → nền hồng cho Patient theme
- `dark:bg-gray-900` → dark mode

---

## 5. Supabase — Backend as a Service (BaaS)

**Website:** https://supabase.com  
**Packages sử dụng:**
- `@supabase/supabase-js` v2.45.0
- `@supabase/auth-helpers-nextjs` v0.10.0

### Supabase là gì?
Supabase là một **dịch vụ backend hoàn chỉnh** — bạn không cần tự dựng server, cơ sở dữ liệu. Supabase cung cấp sẵn:

| Dịch vụ | Mô tả | Project này dùng? |
|---------|-------|------------------|
| **Auth** | Đăng nhập, đăng ký, session | ✅ Có |
| **Database** | PostgreSQL | ✅ Có (qua Prisma) |
| **Storage** | Lưu file, ảnh | Chưa dùng |
| **Realtime** | Cập nhật real-time | Chưa dùng |
| **Edge Functions** | Serverless functions | Chưa dùng |

### Cách Supabase Auth hoạt động:
```
1. User điền email + password
2. Gửi lên Supabase Auth (không qua server của bạn)
3. Supabase tạo JWT token + session
4. Token lưu trong cookie (httpOnly)
5. Mỗi request sau đó, middleware đọc cookie → biết ai đang đăng nhập
```

### Tại sao chọn Supabase?
- **Miễn phí** cho dự án nhỏ (50,000 MAU free)
- **Dễ tích hợp** với Next.js
- **PostgreSQL thực sự** — không phải database fake
- **Row Level Security** — bảo mật ở tầng database
- **Dashboard đẹp** để quản lý data

---

## 6. Prisma — ORM (Object-Relational Mapping)

**Phiên bản:** 6.19 (ORM 6, không nâng Prisma 7)  
**Website:** https://prisma.io

CLI đọc `prisma.config.ts` (schema + seed). `DATABASE_URL` / `DIRECT_URL` vẫn trong `schema.prisma`.

### ORM là gì?
ORM là công cụ giúp bạn tương tác với database bằng **code** thay vì viết SQL thuần.

```typescript
// Không có ORM — viết SQL thuần (dễ lỗi, khó maintain)
const users = await db.query("SELECT * FROM User WHERE role = 'DOCTOR'")

// Có Prisma — viết TypeScript (type-safe, dễ đọc)
const doctors = await prisma.user.findMany({
  where: { role: 'DOCTOR' }
})
// TypeScript biết doctors là User[], với đầy đủ type!
```

### Prisma Schema
File `prisma/schema.prisma` định nghĩa cấu trúc database:

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  role  Role   @default(PATIENT)
  // ...
}
```

Khi chạy `prisma generate`, Prisma tạo ra TypeScript client với đầy đủ type từ schema này.

### Tại sao dùng cả Supabase VÀ Prisma?
> Xem giải thích chi tiết: [🔄 Supabase vs Prisma](../database/supabase-and-prisma.md)

**Tóm tắt ngắn:**
- **Supabase** → xử lý Authentication
- **Prisma** → truy vấn database (viết code dễ hơn, type-safe)

---

## 7. PostgreSQL — Database

**Loại:** Relational Database (CSDL quan hệ)  
**Host:** Supabase (cloud)

PostgreSQL là database mạnh nhất trong các database mã nguồn mở. Trong project này:
- Không tự cài PostgreSQL
- Dùng PostgreSQL **được host sẵn bởi Supabase**
- Kết nối qua `DATABASE_URL` trong `.env`

**Hai loại kết nối:**
```
DATABASE_URL    → Pooled connection (cho serverless/Vercel)
DIRECT_URL      → Direct connection (cho Prisma migrations)
```

---

## 8. Vercel — Deployment Platform

**Website:** https://vercel.com

Vercel là nền tảng deploy ứng dụng web, được tạo ra bởi cùng team làm Next.js. Khi bạn push code lên GitHub, Vercel tự động:
1. Build ứng dụng Next.js
2. Deploy lên CDN toàn cầu
3. Cấp domain HTTPS miễn phí

> Xem chi tiết: [🚀 Triển Khai Vercel](../deployment/vercel.md)

---

## 9. Tóm Tắt Phiên Bản Các Thư Viện

```json
{
  "dependencies": {
    "next": "15.5.12",
    "react": "^19",
    "react-dom": "^19",
    "@prisma/client": "^6.19.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.45.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "prisma": "^6.19.0",
    "typescript": "^5",
    "tailwindcss": "^3.4.17",
    "ts-node": "^10.9.2",
    "eslint": "^8"
  }
}
```

---

## 10. Tại Sao Chọn Stack Này?

| Tiêu chí | Lý do chọn |
|----------|-----------|
| **Next.js** | Fullstack trong 1 project, SEO tốt, deploy Vercel dễ |
| **TypeScript** | Code an toàn hơn, dễ refactor, IDE support tốt |
| **Tailwind** | Nhanh, không cần đặt tên class, responsive dễ |
| **Supabase** | Auth miễn phí, PostgreSQL thực, RLS built-in |
| **Prisma** | Type-safe queries, migration dễ, DX tốt |
| **Vercel** | Deploy tự động, CDN global, free tier tốt |

---

**Tiếp theo:** [🏗️ Mô Hình Fullstack Next.js →](../architecture/fullstack-nextjs.md)
