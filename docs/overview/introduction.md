# 📖 Giới Thiệu Dự Án Clinic Booking

> **Đọc xong tài liệu này bạn sẽ biết:** Dự án làm gì, ai dùng nó, và các tính năng chính là gì.

---

## 1. Dự Án Này Là Gì?

**Clinic Booking** là một hệ thống đặt lịch khám bệnh trực tuyến. Tưởng tượng bạn muốn đặt lịch gặp bác sĩ mà không cần gọi điện hay xếp hàng — đó chính xác là vấn đề project này giải quyết.

### Tóm tắt bằng 1 câu:
> *"Một ứng dụng web cho phép bệnh nhân đặt lịch khám, bác sĩ quản lý lịch hẹn, và admin kiểm soát toàn hệ thống."*

---

## 2. Ai Sử Dụng Hệ Thống?

Hệ thống có **3 loại người dùng** (vai trò):

```
┌─────────────────────────────────────────────────┐
│                 HỆ THỐNG CLINIC                  │
├──────────────┬───────────────┬───────────────────┤
│   PATIENT    │    DOCTOR     │      ADMIN        │
│  (Bệnh nhân) │  (Bác sĩ)    │   (Quản trị)      │
├──────────────┼───────────────┼───────────────────┤
│ - Đặt lịch   │ - Xem lịch   │ - Quản lý users   │
│ - Xem lịch   │ - Xác nhận   │ - Quản lý appts   │
│ - Hủy lịch   │ - Hủy lịch   │ - Thống kê        │
│              │ - Hoàn thành │ - Tạo tài khoản   │
└──────────────┴───────────────┴───────────────────┘
```

---

## 3. Các Tính Năng Chính

### 👤 Bệnh Nhân (Patient)
- Đăng ký tài khoản, đăng nhập
- Xem danh sách bác sĩ theo chuyên khoa
- Đặt lịch hẹn: chọn bác sĩ → chọn ngày giờ → nhập triệu chứng
- Xem lịch sử các lịch hẹn (đang chờ, đã xác nhận, đã hủy, hoàn thành)
- Hủy lịch hẹn
- Xem thống kê: tổng lịch hẹn, lịch hẹn sắp tới, lịch đã hoàn thành

### 👨‍⚕️ Bác Sĩ (Doctor)
- Đăng nhập vào dashboard riêng
- Xem toàn bộ lịch hẹn của mình
- Lọc lịch hẹn theo trạng thái (Chờ xác nhận / Đã xác nhận / Đã hoàn thành)
- Xác nhận (CONFIRMED), hủy (CANCELLED), hoặc đánh dấu hoàn thành (COMPLETED) lịch hẹn
- Xem thống kê: tổng số bệnh nhân, lịch hôm nay, tỷ lệ hoàn thành

### ⚙️ Admin
- Đăng nhập vào bảng quản trị riêng
- Xem tất cả lịch hẹn trong hệ thống
- Lọc lịch hẹn theo trạng thái, tìm kiếm theo tên bệnh nhân/bác sĩ
- Xóa lịch hẹn
- Quản lý người dùng: xem, tạo, sửa, xóa
- Thống kê tổng quan hệ thống

---

## 4. Trạng Thái Lịch Hẹn

```
PENDING (Chờ xác nhận)
    ↓
CONFIRMED (Đã xác nhận) ─── hoặc ──→ CANCELLED (Đã hủy)
    ↓
COMPLETED (Đã hoàn thành)
```

| Trạng thái | Màu sắc | Ai có thể thay đổi |
|------------|---------|-------------------|
| PENDING | Vàng | Doctor/Admin có thể confirm/cancel |
| CONFIRMED | Xanh lá | Doctor có thể complete; Patient/Doctor có thể cancel |
| CANCELLED | Đỏ | Trạng thái cuối |
| COMPLETED | Xanh dương | Trạng thái cuối |

---

## 5. Giao Diện & Theme

Hệ thống có **3 theme** tương ứng với từng vai trò:

| Vai trò | Theme | Màu chủ đạo |
|---------|-------|-------------|
| Admin | `admin` | Tím (Indigo) |
| Doctor | `doctor` | Xanh da trời (Sky Blue) |
| Patient | `patient` | Hồng (Pink) |

Người dùng có thể bật/tắt **Dark Mode**.

---

## 6. Dữ Liệu Mẫu (Seed Data)

Khi chạy `npm run seed`, hệ thống sẽ tạo sẵn:

| Loại | Số lượng | Chi tiết |
|------|----------|---------- |
| Bác sĩ | 5 | Tim mạch, Nhi, Da liễu, Thần kinh, Chỉnh hình |
| Bệnh nhân | 3 | Tên Việt Nam |
| Admin | 1 | Tài khoản quản trị |
| Lịch hẹn mẫu | 4 | Các trạng thái khác nhau |

---

## 7. Luồng Sử Dụng Đơn Giản

```
1. Người dùng truy cập website → tự động chuyển về /login
2. Đăng nhập hoặc đăng ký
3. Hệ thống đọc vai trò (role) → chuyển đến dashboard phù hợp:
   - PATIENT  → /patient/dashboard
   - DOCTOR   → /doctor/dashboard
   - ADMIN    → /admin/dashboard
4. Mỗi người dùng thấy giao diện và chức năng phù hợp với vai trò của mình
```

---

## 8. Tóm Tắt Kỹ Thuật Nhanh

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS |
| Xác thực | Supabase Auth |
| Database | PostgreSQL (qua Supabase) |
| ORM | Prisma 6 |
| Deploy | Vercel |
| Ngôn ngữ | TypeScript |

> Xem chi tiết hơn tại: [🛠️ Công Nghệ Sử Dụng](./tech-stack.md)

---

**Tiếp theo:** [🛠️ Công Nghệ Sử Dụng →](./tech-stack.md)
