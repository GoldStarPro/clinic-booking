# 🗄️ Schema Database

> **Đọc xong tài liệu này bạn sẽ biết:** Hệ thống có những bảng dữ liệu gì, cấu trúc từng bảng, và mối quan hệ giữa chúng.

---

## 1. Tổng Quan Database

Hệ thống dùng **PostgreSQL** được host trên Supabase. Có **2 bảng chính** (MVP học tập — cố ý tối giản, chưa phải HIS bệnh viện):

```
┌──────────────────────────────────────────────┐
│                   DATABASE                    │
│                                               │
│  ┌──────────────┐      ┌────────────────────┐ │
│  │     User     │      │    Appointment     │ │
│  │              │      │                    │ │
│  │ id (PK)      │◄─────│ patientId (FK)     │ │
│  │ email        │      │                    │ │
│  │ name         │◄─────│ doctorId (FK)      │ │
│  │ role         │      │                    │ │
│  │ phone        │      │ id (PK)            │ │
│  │ specialty    │      │ date               │ │
│  │ ...          │      │ time               │ │
│  └──────────────┘      │ status             │ │
│                        │ symptoms           │ │
│                        │ notes              │ │
│                        └────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 2. Bảng `User`

Bảng này chứa **tất cả người dùng** — bệnh nhân, bác sĩ, admin — trong cùng 1 bảng. Vai trò phân biệt bởi trường `role`.

### Cấu trúc

```prisma
model User {
  id          String    @id @default(uuid())
  email       String    @unique
  name        String
  role        Role      @default(PATIENT)
  phone       String?
  address     String?
  specialty   String?     // Chỉ dùng khi role = DOCTOR
  description String?     // Chỉ dùng khi role = DOCTOR
  image       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  patientAppointments Appointment[] @relation("PatientAppointments")
  doctorAppointments  Appointment[] @relation("DoctorAppointments")
}
```

### Giải thích từng trường

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | String (UUID) | Có | ID duy nhất, tự sinh (ví dụ: `"a1b2c3..."`) |
| `email` | String | Có | Email đăng nhập, phải duy nhất |
| `name` | String | Có | Họ tên đầy đủ |
| `role` | Enum | Có | PATIENT / DOCTOR / ADMIN |
| `phone` | String? | Không | Số điện thoại |
| `address` | String? | Không | Địa chỉ |
| `specialty` | String? | Không | Chuyên khoa (chỉ dùng cho DOCTOR) |
| `description` | String? | Không | Mô tả bác sĩ (chỉ dùng cho DOCTOR) |
| `image` | String? | Không | URL ảnh đại diện |
| `createdAt` | DateTime | Có | Thời điểm tạo (tự động) |
| `updatedAt` | DateTime | Có | Thời điểm cập nhật cuối (tự động) |

### Ví dụ dữ liệu thực

**Bác sĩ:**
```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "email": "dr.nam@clinic.com",
  "name": "Dr. Nguyễn Văn Nam",
  "role": "DOCTOR",
  "specialty": "Cardiology",
  "description": "Chuyên gia tim mạch với 15 năm kinh nghiệm",
  "phone": "0912345678"
}
```

**Bệnh nhân:**
```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "email": "patient@gmail.com",
  "name": "Trần Thị Lan",
  "role": "PATIENT",
  "phone": "0987654321",
  "specialty": null,
  "description": null
}
```

### Tại sao gộp tất cả vai trò vào 1 bảng?

> Đây là thiết kế **Single Table Inheritance (STI)** — lưu nhiều loại entity vào 1 bảng, phân biệt bằng cột `type/role`.

**Ưu điểm:**
- Đơn giản hơn: 1 query lấy được user bất kể role
- Dễ quản lý: 1 bảng thay vì 3 bảng (UserPatient, UserDoctor, UserAdmin)
- Chia sẻ trường chung (name, email) không bị duplicate

**Nhược điểm:**
- Có trường "thừa" (bệnh nhân có cột specialty = NULL)
- Khi data lớn, query khó tối ưu hơn

*Note: Trước đây project có bảng Doctor riêng, nhưng đã được gộp vào User (xem migration `20250429142033_remove_doctor_table`).*

---

## 3. Bảng `Appointment`

Bảng này lưu **lịch hẹn** giữa bệnh nhân và bác sĩ.

### Cấu trúc

```prisma
model Appointment {
  id        String   @id @default(uuid())
  patientId String
  doctorId  String
  date      DateTime
  time      String
  status    Status   @default(PENDING)
  notes     String?
  symptoms  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Foreign key relations
  patient   User     @relation("PatientAppointments", fields: [patientId], references: [id])
  doctor    User     @relation("DoctorAppointments", fields: [doctorId], references: [id])

  // Performance indexes
  @@index([patientId])
  @@index([doctorId])
}
```

### Giải thích từng trường

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | String (UUID) | Có | ID duy nhất |
| `patientId` | String (FK) | Có | ID bệnh nhân (tham chiếu User.id) |
| `doctorId` | String (FK) | Có | ID bác sĩ (tham chiếu User.id) |
| `date` | DateTime | Có | Ngày hẹn (ví dụ: 2025-12-25T00:00:00Z) |
| `time` | String | Có | Giờ hẹn dạng "HH:MM" (ví dụ: "09:00") |
| `status` | Enum | Có | PENDING/CONFIRMED/CANCELLED/COMPLETED |
| `symptoms` | String? | Không | Triệu chứng bệnh nhân mô tả |
| `notes` | String? | Không | Ghi chú thêm từ bệnh nhân |
| `createdAt` | DateTime | Có | Thời điểm đặt lịch |
| `updatedAt` | DateTime | Có | Cập nhật lần cuối |

### Ví dụ dữ liệu thực

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "patientId": "22222222-2222-2222-2222-222222222222",
  "doctorId": "11111111-1111-1111-1111-111111111111",
  "date": "2025-12-25T00:00:00.000Z",
  "time": "09:00",
  "status": "CONFIRMED",
  "symptoms": "Đau ngực, khó thở khi gắng sức",
  "notes": "Đã dùng thuốc hạ áp 3 tháng"
}
```

### Về Database Indexes
```prisma
@@index([patientId])   // Tìm kiếm theo bệnh nhân nhanh
@@index([doctorId])    // Tìm kiếm theo bác sĩ nhanh
```

Indexes giúp query nhanh hơn. Ví dụ: "Lấy tất cả lịch hẹn của bác sĩ X" — không cần scan toàn bảng.

---

## 4. Enums (Kiểu Liệt Kê)

### Role Enum
```prisma
enum Role {
  PATIENT   // Bệnh nhân
  DOCTOR    // Bác sĩ
  ADMIN     // Quản trị viên
}
```

### Status Enum
```prisma
enum Status {
  PENDING     // Chờ xác nhận
  CONFIRMED   // Đã xác nhận
  CANCELLED   // Đã hủy
  COMPLETED   // Đã hoàn thành
}
```

**Tại sao dùng Enum thay vì String?**
- Giới hạn giá trị hợp lệ: không thể lưu "ADMIN2" hay "pending" (viết thường)
- Database-level validation
- TypeScript biết chính xác các giá trị có thể có

---

## 5. Quan Hệ Giữa Các Bảng (Relations)

```
User (Patient) ─────────────────────────────────┐
                                                 │
                                         1:N     │
                    Appointment.patientId ────────┘
                    Appointment.doctorId  ────────┐
                                         N:1     │
User (Doctor) ──────────────────────────────────┘
```

**Giải thích:** Một bệnh nhân có thể có **nhiều** lịch hẹn (1:N). Một bác sĩ cũng có thể có **nhiều** lịch hẹn (1:N). Mỗi lịch hẹn chỉ có đúng **1 bệnh nhân** và **1 bác sĩ**.

### Khi query với Prisma

```typescript
// Lấy lịch hẹn kèm thông tin bác sĩ và bệnh nhân
const appointments = await prisma.appointment.findMany({
  where: { patientId: userId },
  include: {
    doctor: {           // JOIN với bảng User (doctor)
      select: {
        name: true,
        specialty: true,
        image: true
      }
    },
    patient: {          // JOIN với bảng User (patient)
      select: {
        name: true,
        phone: true
      }
    }
  }
})
```

---

## 6. Lịch Sử Thay Đổi Schema (Migrations)

Prisma lưu lịch sử thay đổi database trong `prisma/migrations/`:

| File Migration | Thay đổi |
|---------------|---------|
| `20250429142033_remove_doctor_table` | Xóa bảng Doctor riêng, gộp vào bảng User với trường `specialty` |

**Bài học:** Đừng sợ thay đổi schema — Prisma migration giúp thay đổi an toàn và có thể rollback.

Schema 2 bảng là **mốc học tập**. Chuẩn doanh nghiệp y tế (Patient / Practitioner / Encounter / Prescription / AuditLog) → [📈 Lộ Trình Nâng Cấp § 2.5](../architecture-comparison/upgrade-roadmap.md).

---

**Tiếp theo:** [🔒 RLS Policies →](./rls-policies.md)
