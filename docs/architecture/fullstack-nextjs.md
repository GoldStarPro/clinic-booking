# 🏗️ Mô Hình Fullstack Next.js

> **Câu hỏi được giải đáp:** *"Tại sao project có cả Backend lẫn Frontend trong cùng 1 folder? Đây là mô hình gì?"*

---

## 1. Vấn Đề Ban Đầu: Truyền Thống vs Hiện Đại

### Cách truyền thống (tách biệt)
```
project/
├── frontend/     ← React app (chỉ giao diện)
│   └── src/
└── backend/      ← Node.js/Express (chỉ API)
    └── src/
```
- Frontend chạy riêng: `http://localhost:3000`
- Backend chạy riêng: `http://localhost:8080`
- Frontend **gọi API** đến backend để lấy data

### Cách project này làm (Fullstack trong Next.js)
```
clinic-booking/
└── src/
    ├── app/
    │   ├── page.tsx           ← Trang giao diện (FE)
    │   ├── admin/dashboard/   ← Trang giao diện (FE)
    │   └── api/               ← API endpoints (BE!) ← Đây!
    │       ├── appointments/route.ts
    │       ├── doctors/route.ts
    │       └── auth/login/route.ts
    ├── components/            ← UI components (FE)
    └── lib/                   ← Utilities dùng chung
```

**Cả FE và BE nằm trong 1 project!**

---

## 2. Next.js API Routes — "Backend" Là Gì?

File `src/app/api/appointments/route.ts` là một **API endpoint thực sự** — không khác gì bạn viết Express.js:

```typescript
// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Xử lý GET /api/appointments
export async function GET(req: NextRequest) {
  const appointments = await prisma.appointment.findMany()
  return NextResponse.json(appointments)
}

// Xử lý POST /api/appointments
export async function POST(req: NextRequest) {
  const body = await req.json()
  const appointment = await prisma.appointment.create({ data: body })
  return NextResponse.json(appointment, { status: 201 })
}
```

Khi deploy lên Vercel, mỗi file `route.ts` này trở thành một **Serverless Function** độc lập — tức là một "mini server" chỉ xử lý 1 endpoint cụ thể.

---

## 3. Sơ Đồ: Một Request Đi Như Thế Nào?

```
Browser (User)
    │
    │ 1. Truy cập /patient/dashboard
    ▼
┌─────────────────────────────────────┐
│           Next.js Server            │
│  ┌─────────────────────────────┐   │
│  │    Middleware (middleware.ts) │   │ ← Chạy đầu tiên, mọi request
│  │  - Kiểm tra session          │   │
│  │  - Bảo mật headers           │   │
│  │  - Phân quyền route          │   │
│  └─────────────────────────────┘   │
│              │                      │
│  ┌─────────────────────────────┐   │
│  │    Page Component            │   │ ← Render HTML/React
│  │  patient/dashboard/page.tsx  │   │
│  └─────────────────────────────┘   │
│              │                      │
│  2. Page gọi fetch('/api/appointments')
│              │                      │
│  ┌─────────────────────────────┐   │
│  │    API Route                 │   │ ← Chạy trên server
│  │  api/appointments/route.ts   │   │
│  │  - Validate input            │   │
│  │  - Query database (Prisma)   │   │
│  │  - Return JSON               │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
    │
    │ 3. Kết nối đến Supabase Database
    ▼
┌─────────────────────────────────────┐
│         Supabase (Cloud)            │
│  - PostgreSQL Database              │
│  - Authentication                   │
│  - Row Level Security               │
└─────────────────────────────────────┘
```

---

## 4. Phân Biệt: Code Chạy Ở Đâu?

Trong Next.js App Router, có 2 môi trường chạy code:

### Server Components (mặc định)
```typescript
// src/app/admin/dashboard/page.tsx
// Không có 'use client' → chạy trên server

export default async function AdminDashboard() {
  // Có thể gọi database trực tiếp!
  const count = await prisma.appointment.count()
  
  return <div>Total: {count}</div>
}
```
- Chạy trên **server** (Node.js trên Vercel)
- Có thể truy cập database, file system, env variables bí mật
- Không có JavaScript gửi về browser → nhẹ hơn

### Client Components
```typescript
// 'use client' ← bắt buộc phải có dòng này
'use client'
import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  // useState, useEffect chỉ dùng được ở client component
  
  return <input value={email} onChange={e => setEmail(e.target.value)} />
}
```
- Chạy trên **browser**
- Có thể dùng `useState`, `useEffect`, event handlers
- JavaScript được gửi về browser

### Quy tắc trong project:
| Trang/Component | Server/Client | Lý do |
|----------------|---------------|-------|
| `admin/dashboard/page.tsx` | Client | Cần `useState` để quản lý filter |
| `api/appointments/route.ts` | Server | Chạy trên server, gọi Prisma |
| `components/AppointmentCard.tsx` | Client | Có button click handlers |
| `lib/security.ts` | Server | Chỉ dùng trong API routes |

---

## 5. Tại Sao Mô Hình Này Hoạt Động Được?

### Next.js "tách" code tự động
Khi build, Next.js tự phân tách:
- Code nào chạy trên server → bundle server
- Code nào chạy trên browser → bundle client

Bạn không cần cấu hình gì thêm — Next.js tự lo.

### Vercel xử lý cả hai phần
```
Khi deploy lên Vercel:

src/app/page.tsx              → Static page hoặc Server Component
src/app/api/*/route.ts        → Serverless Functions (AWS Lambda)
public/                       → Static files (CDN)
```

Vercel tự động nhận ra và deploy đúng từng phần.

---

## 6. Ưu & Nhược Điểm Của Mô Hình Này

### Ưu điểm
| Lợi ích | Giải thích |
|---------|-----------|
| **Đơn giản hơn** | 1 repository, 1 codebase, 1 lần deploy |
| **Không CORS** | FE và API cùng domain → không cần xử lý CORS phức tạp |
| **Chia sẻ code** | Types, utils dùng chung giữa FE và BE |
| **Deploy nhanh** | Push 1 lần là cả FE lẫn API được deploy |
| **DX tốt** | `npm run dev` là chạy được hết |

### Nhược điểm
| Hạn chế | Giải thích |
|---------|-----------|
| **Khó scale riêng lẻ** | Không thể scale chỉ BE mà không scale FE |
| **Vendor lock-in** | Phụ thuộc nhiều vào Next.js/Vercel |
| **Giới hạn serverless** | Mỗi API route chạy tối đa 10 giây (Vercel free) |
| **Khó dùng WebSocket** | Serverless không giữ connection lâu dài |
| **Team lớn khó** | Dev BE và FE làm cùng codebase có thể conflict |

> Xem so sánh đầy đủ: [⚖️ So Sánh Kiến Trúc](../architecture-comparison/monolith-vs-separated.md)

---

## 7. Kết Luận

Đây là mô hình **"Fullstack Monorepo với Next.js"** — rất phổ biến cho:
- Startup nhỏ, team nhỏ
- MVP (Minimum Viable Product)
- Dự án cá nhân/học tập
- Ứng dụng không quá phức tạp về nghiệp vụ backend

Khi dự án lớn lên và cần scale, có thể tách BE riêng (NestJS, Express, FastAPI) — xem [📈 Lộ Trình Nâng Cấp](../architecture-comparison/upgrade-roadmap.md).

---

**Tiếp theo:** [📁 Cấu Trúc Thư Mục →](./folder-structure.md)
