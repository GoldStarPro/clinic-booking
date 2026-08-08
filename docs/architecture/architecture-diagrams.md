# 📊 Sơ Đồ Kiến Trúc Hệ Thống

> **Đọc xong tài liệu này bạn sẽ biết:** Toàn bộ luồng xử lý từ khi user mở browser đến khi data lưu vào database.

---

## 1. Kiến Trúc Tổng Quan

```
┌──────────────────────────────────────────────────────────────────┐
│                         INTERNET                                  │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    VERCEL (Cloud Platform)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     CDN (Edge Network)                       │ │
│  │  - Static assets (JS, CSS, images)                          │ │
│  │  - Cached pages                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Next.js Application Server                      │ │
│  │                                                              │ │
│  │  ┌─────────────────┐   ┌──────────────────────────────────┐ │ │
│  │  │   Middleware     │   │      Pages & Layouts             │ │ │
│  │  │  (Edge Runtime)  │   │   (Server/Client Components)     │ │ │
│  │  └─────────────────┘   └──────────────────────────────────┘ │ │
│  │           │                          │                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              Serverless Functions                        │ │ │
│  │  │              (API Routes: /api/*)                        │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                   │
└──────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                  │
              ▼                                  ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│   SUPABASE (Cloud)       │       │   SUPABASE Auth (Cloud)     │
│                          │       │                             │
│  PostgreSQL Database     │       │  - JWT tokens               │
│  - User table            │       │  - Session management       │
│  - Appointment table     │       │  - Email verification       │
│  - Row Level Security    │       │                             │
└─────────────────────────┘       └─────────────────────────────┘
```

---

## 2. Luồng Đăng Nhập (Authentication Flow)

```
User (Browser)                Next.js App              Supabase
     │                              │                       │
     │  1. Điền email + password    │                       │
     │  POST /api/auth/login        │                       │
     │─────────────────────────────►│                       │
     │                              │                       │
     │                              │ 2. Gọi Supabase Auth  │
     │                              │  signInWithPassword() │
     │                              │──────────────────────►│
     │                              │                       │
     │                              │  3. Trả về JWT token  │
     │                              │  + session data       │
     │                              │◄──────────────────────│
     │                              │                       │
     │                              │ 4. Lấy user profile   │
     │                              │  từ database (Prisma) │
     │                              │──────────────────────►│
     │                              │                       │
     │  5. Trả về user + role       │◄──────────────────────│
     │◄─────────────────────────────│                       │
     │                              │                       │
     │  6. Session lưu trong Cookie │                       │
     │  7. Redirect sang dashboard  │                       │
```

---

## 3. Luồng Middleware (Mọi Request)

```
Request đến bất kỳ URL nào
          │
          ▼
┌─────────────────────────────────────────────┐
│              middleware.ts                   │
│                                             │
│  Step 1: Thêm Security Headers              │
│  ┌───────────────────────────────────────┐  │
│  │ X-Content-Type-Options: nosniff       │  │
│  │ X-Frame-Options: DENY                 │  │
│  │ X-XSS-Protection: 1; mode=block       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Step 2: Refresh Session (nếu hết hạn)      │
│                                             │
│  Step 3: Kiểm tra URL có public không?      │
│  ┌───────────────────────────────────────┐  │
│  │ /login, /register, / → Cho qua ngay   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Step 4: Có session không?                  │
│  ┌───────────────────────────────────────┐  │
│  │ Không có → Redirect về /login          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Step 5: Đọc role từ database              │
│  Step 6: Kiểm tra quyền truy cập route     │
│  ┌───────────────────────────────────────┐  │
│  │ /admin/* → Phải là ADMIN              │  │
│  │ /doctor/* → Phải là DOCTOR            │  │
│  │ /patient/* → Phải là PATIENT          │  │
│  │ Sai role → Redirect về /login         │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Step 7: Xử lý CORS cho /api/* routes      │
└─────────────────────────────────────────────┘
          │
          ▼
    Request được cho qua
```

---

## 4. Luồng Đặt Lịch Hẹn (Booking Flow)

```
Patient (Browser)             Next.js API              Supabase DB
     │                              │                       │
     │  1. Vào /book-appointment    │                       │
     │  GET /api/doctors            │                       │
     │─────────────────────────────►│                       │
     │                              │                       │
     │                              │ 2. prisma.user.       │
     │                              │  findMany({           │
     │                              │   where:{role:DOCTOR} │
     │                              │  })                   │
     │                              │──────────────────────►│
     │                              │◄──────────────────────│
     │  3. Nhận danh sách bác sĩ   │                       │
     │◄─────────────────────────────│                       │
     │                              │                       │
     │  4. Chọn bác sĩ, ngày, giờ  │                       │
     │  Nhập triệu chứng            │                       │
     │  POST /api/appointments      │                       │
     │  { doctorId, date, time,     │                       │
     │    symptoms }                │                       │
     │─────────────────────────────►│                       │
     │                              │                       │
     │                              │ 5. Validate input     │
     │                              │  (security.ts)        │
     │                              │                       │
     │                              │ 6. Rate limit check   │
     │                              │                       │
     │                              │ 7. Đọc session →      │
     │                              │  lấy patientId        │
     │                              │                       │
     │                              │ 8. prisma.appointment │
     │                              │  .create({...})       │
     │                              │──────────────────────►│
     │                              │                       │
     │                              │  RLS Policy check:    │
     │                              │  patientId ==         │
     │                              │  auth.uid()?          │
     │                              │◄──────────────────────│
     │  9. Lịch hẹn được tạo       │                       │
     │◄─────────────────────────────│                       │
     │  10. Redirect /my-appointments│                      │
```

---

## 5. Kiến Trúc Layer (Tầng Lớp)

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│         (src/app/*/page.tsx, src/components/)            │
│  - Giao diện người dùng                                  │
│  - Form nhập liệu                                        │
│  - Hiển thị dữ liệu                                      │
└─────────────────────────────────────────────────────────┘
                           │
                    HTTP Request
                           │
┌─────────────────────────────────────────────────────────┐
│                     MIDDLEWARE LAYER                     │
│                   (src/middleware.ts)                    │
│  - Authentication check                                  │
│  - Authorization (role-based)                            │
│  - Security headers                                      │
│  - CORS                                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────┐
│                      API LAYER                           │
│                  (src/app/api/*/route.ts)                │
│  - Rate limiting                                         │
│  - Input validation & sanitization                       │
│  - Business logic                                        │
│  - Response formatting                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                        │
│              (src/lib/security.ts, date-utils.ts)        │
│  - Reusable business functions                           │
│  - Validation functions                                  │
│  - Utility functions                                     │
└─────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                           │
│           (Prisma Client → Supabase PostgreSQL)          │
│  - Database queries                                      │
│  - Data persistence                                      │
│  - Row Level Security (ở tầng DB)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Cách Các Layer Tương Tác Nhau

```
Page (FE)          API Route (BE)        Lib            Database
    │                    │                │                 │
    │ fetch('/api/...')   │                │                 │
    │───────────────────►│                │                 │
    │                    │                │                 │
    │                    │ getClientIP()  │                 │
    │                    │───────────────►│                 │
    │                    │◄───────────────│                 │
    │                    │                │                 │
    │                    │ checkRateLimit()                 │
    │                    │───────────────►│                 │
    │                    │◄───────────────│                 │
    │                    │                │                 │
    │                    │ validateAppointmentData()        │
    │                    │───────────────►│                 │
    │                    │◄───────────────│                 │
    │                    │                │                 │
    │                    │ prisma.appointment.create()      │
    │                    │────────────────────────────────►│
    │                    │◄────────────────────────────────│
    │                    │                │                 │
    │◄───────────────────│                │                 │
    │   JSON Response     │                │                 │
```

---

## 7. Luồng Theme (Giao Diện)

```
User truy cập URL
       │
       ▼
ThemeSwitcher.tsx (usePathname)
       │
       ├── URL bắt đầu bằng /admin  → Theme "admin" (Indigo)
       ├── URL bắt đầu bằng /doctor → Theme "doctor" (Sky Blue)
       └── Còn lại                  → Theme "patient" (Pink)
       │
       ▼
ThemeProvider.tsx (React Context)
       │
       ▼
Tất cả components con đọc theme từ Context
       │
       ▼
Áp CSS classes tương ứng (Tailwind)
```

---

**Tiếp theo:** [🗄️ Schema Database →](../database/schema.md)
