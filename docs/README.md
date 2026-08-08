# 📚 Tài Liệu Dự Án Clinic Booking

> **Dành cho:** Người mới học (Newbie) muốn hiểu toàn bộ dự án từ A–Z  
> **Mức độ:** Từ cơ bản đến nâng cao  
> **Ngôn ngữ:** Tiếng Việt

---

## 🗺️ Lộ Trình Đọc Tài Liệu (Đọc theo thứ tự này!)

Nếu bạn là người mới, hãy đọc **tuần tự từ trên xuống dưới**. Mỗi phần được xây dựng dựa trên kiến thức của phần trước.

---

### 🟢 GIAI ĐOẠN 1 — Hiểu Tổng Quan (30 phút)
*Mục tiêu: Biết dự án này làm gì, dùng công nghệ gì*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 1 | [📖 Giới Thiệu Dự Án](./overview/introduction.md) | Dự án là gì, ai dùng, làm được gì | 10 phút |
| 2 | [🛠️ Công Nghệ Sử Dụng](./overview/tech-stack.md) | Chi tiết từng thư viện, tại sao chọn | 20 phút |

---

### 🔵 GIAI ĐOẠN 2 — Hiểu Kiến Trúc (45 phút)
*Mục tiêu: Hiểu tại sao có cả BE lẫn FE trong 1 project, cấu trúc thư mục*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 3 | [🏗️ Mô Hình Fullstack Next.js](./architecture/fullstack-nextjs.md) | **Giải đáp: "Sao có cả BE và FE trong 1 project?"** | 20 phút |
| 4 | [📁 Cấu Trúc Thư Mục](./architecture/folder-structure.md) | Từng folder, từng file làm gì | 15 phút |
| 5 | [📊 Sơ Đồ Kiến Trúc](./architecture/architecture-diagrams.md) | Sơ đồ luồng request từ User → DB | 10 phút |

---

### 🟡 GIAI ĐOẠN 3 — Hiểu Database (40 phút)
*Mục tiêu: Hiểu Supabase là gì, Prisma là gì, Policies hoạt động thế nào*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 6 | [🗄️ Schema Database](./database/schema.md) | Các bảng dữ liệu, quan hệ giữa chúng | 10 phút |
| 7 | [🔒 RLS Policies](./database/rls-policies.md) | **Giải đáp: "Policies là gì, áp lên database thế nào?"** | 20 phút |
| 8 | [🔄 Supabase vs Prisma](./database/supabase-and-prisma.md) | Tại sao dùng cả 2, mỗi cái làm gì | 10 phút |

---

### 🟠 GIAI ĐOẠN 4 — Hiểu Xác Thực & Phân Quyền (30 phút)
*Mục tiêu: Hiểu luồng đăng nhập, ai được làm gì*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 9 | [🔐 Luồng Xác Thực](./auth-and-authorization/authentication-flow.md) | Đăng nhập, đăng ký, session hoạt động thế nào | 15 phút |
| 10 | [👥 Phân Quyền Theo Vai Trò](./auth-and-authorization/role-based-access.md) | Patient/Doctor/Admin có quyền gì | 15 phút |

---

### 🔴 GIAI ĐOẠN 5 — Hiểu Tính Năng (45 phút)
*Mục tiêu: Hiểu từng luồng nghiệp vụ chính của hệ thống*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 11 | [📅 Luồng Đặt Lịch Hẹn](./features/booking-flow.md) | Bệnh nhân đặt lịch từ đầu đến cuối | 15 phút |
| 12 | [👨‍⚕️ Dashboard Bác Sĩ](./features/doctor-dashboard.md) | Bác sĩ xem và quản lý lịch hẹn | 15 phút |
| 13 | [⚙️ Quản Lý Admin](./features/admin-management.md) | Admin quản lý toàn hệ thống | 15 phút |

---

### 🟣 GIAI ĐOẠN 6 — Bảo Mật & Triển Khai (30 phút)
*Mục tiêu: Hiểu hệ thống được bảo vệ thế nào, deploy ra sao*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 14 | [🛡️ Tổng Quan Bảo Mật](./security/overview.md) | Rate limiting, validation, headers bảo mật | 15 phút |
| 15 | [🚀 Triển Khai Vercel](./deployment/vercel.md) | **Giải đáp: "Sao deploy được trên Vercel?"** | 10 phút |
| 16 | [🔑 Biến Môi Trường](./deployment/environment-variables.md) | Toàn bộ .env cần thiết | 5 phút |

---

### ⚪ GIAI ĐOẠN 7 — Nâng Cao & Mở Rộng (60 phút)
*Mục tiêu: Hiểu hướng phát triển tiếp theo, so sánh các kiến trúc*

| # | Tài liệu | Mô tả | Thời gian |
|---|----------|-------|-----------|
| 17 | [⚖️ So Sánh Kiến Trúc](./architecture-comparison/monolith-vs-separated.md) | **Fullstack vs BE/FE riêng: lợi hại thế nào?** | 20 phút |
| 18 | [📈 Lộ Trình Nâng Cấp](./architecture-comparison/upgrade-roadmap.md) | Các hướng mở rộng để đúng chuẩn production | 20 phút |
| 19 | [🔨 Tự Xây Dự Án Tương Tự](./getting-started/build-from-scratch.md) | Step-by-step xây dự án clinic từ đầu | 20 phút |

---

## 📌 Tra Cứu Nhanh

### Tôi bị rối về...

| Vấn đề | Đọc tài liệu |
|--------|-------------|
| "Sao có cả API route và page trong cùng 1 project?" | [🏗️ Mô Hình Fullstack Next.js](./architecture/fullstack-nextjs.md) |
| "Policies là gì? Áp lên đâu?" | [🔒 RLS Policies](./database/rls-policies.md) |
| "Prisma và Supabase khác nhau thế nào?" | [🔄 Supabase vs Prisma](./database/supabase-and-prisma.md) |
| "Tại sao deploy lên Vercel được?" | [🚀 Triển Khai Vercel](./deployment/vercel.md) |
| "Middleware làm gì?" | [🔐 Luồng Xác Thực](./auth-and-authorization/authentication-flow.md) |
| "FE tách riêng thì làm thế nào?" | [⚖️ So Sánh Kiến Trúc](./architecture-comparison/monolith-vs-separated.md) |
| "Muốn xây project tương tự từ đầu" | [🔨 Tự Xây Dự Án Tương Tự](./getting-started/build-from-scratch.md) |

---

## 🗂️ Cấu Trúc Thư Mục Tài Liệu

```
docs/
├── README.md                          ← Bạn đang ở đây (Index)
│
├── overview/                           ← Tổng quan dự án
│   ├── introduction.md
│   └── tech-stack.md
│
├── architecture/                      ← Kiến trúc & cấu trúc code
│   ├── fullstack-nextjs.md
│   ├── folder-structure.md
│   └── architecture-diagrams.md
│
├── database/                          ← Schema, RLS, Supabase & Prisma
│   ├── schema.md
│   ├── rls-policies.md
│   └── supabase-and-prisma.md
│
├── auth-and-authorization/            ← Xác thực & phân quyền
│   ├── authentication-flow.md
│   └── role-based-access.md
│
├── features/                          ← Luồng tính năng
│   ├── booking-flow.md
│   ├── doctor-dashboard.md
│   └── admin-management.md
│
├── security/                          ← Bảo mật (gộp chung)
│   ├── overview.md
│   ├── README.md
│   └── SECURITY.md
│
├── deployment/                        ← Triển khai
│   ├── vercel.md
│   └── environment-variables.md
│
├── architecture-comparison/           ← So sánh kiến trúc & nâng cấp
│   ├── monolith-vs-separated.md
│   └── upgrade-roadmap.md
│
└── getting-started/                   ← Hướng dẫn thực hành
    └── build-from-scratch.md
```

---

> **Tip:** Bookmark trang này làm điểm xuất phát. Mỗi khi bạn bị rối, quay lại đây và tìm đúng tài liệu cần đọc.
