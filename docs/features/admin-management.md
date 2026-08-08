# ⚙️ Quản Lý Admin

> **Đọc xong tài liệu này bạn sẽ biết:** Admin có quyền gì, quản lý hệ thống thế nào.

---

## 1. Các Trang Admin

| URL | Chức năng |
|-----|-----------|
| `/admin/dashboard` | Xem toàn bộ lịch hẹn, lọc, tìm kiếm, xóa |
| `/admin/users` | Danh sách tất cả users |
| `/admin/users/create` | Tạo tài khoản mới |
| `/admin/users/[id]` | Sửa thông tin user |

---

## 2. Admin Dashboard

### Hiển thị thống kê:
```
┌──────────────────────────────────────────────────────────┐
│  Tổng lịch hẹn: 128  │  Hôm nay: 12  │  Chờ xử lý: 24  │
└──────────────────────────────────────────────────────────┘
```

### Bộ lọc và tìm kiếm:
```typescript
// Lọc theo status
const [statusFilter, setStatusFilter] = useState('ALL')

// Tìm kiếm theo tên bệnh nhân / bác sĩ
const [searchQuery, setSearchQuery] = useState('')

const filtered = appointments
  .filter(a => statusFilter === 'ALL' || a.status === statusFilter)
  .filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.patient.name.toLowerCase().includes(q) || 
           a.doctor.name.toLowerCase().includes(q)
  })
```

### API lấy tất cả appointments (Admin):
```typescript
// GET /api/appointments — Khi role = ADMIN
const appointments = await prisma.appointment.findMany({
  include: {
    doctor: { select: { name: true, specialty: true, image: true } },
    patient: { select: { name: true, phone: true } }
  },
  orderBy: { createdAt: 'desc' }
})
// Admin thấy TẤT CẢ, không lọc theo patientId/doctorId
```

---

## 3. Xóa Lịch Hẹn (Admin only)

### Confirm trước khi xóa:
```
┌──────────────────────────────────────┐
│         XÁC NHẬN XÓA                │
│                                      │
│  Bạn có chắc muốn xóa lịch hẹn này? │
│  Hành động này không thể hoàn tác.   │
│                                      │
│      [Hủy bỏ]   [Xóa]               │
└──────────────────────────────────────┘
```

### API xóa:
```typescript
// DELETE /api/admin/appointments/[id]
export async function DELETE(req: NextRequest, { params }) {
  // 1. Kiểm tra admin
  const user = await getUserFromSession()
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Xóa
  await prisma.appointment.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ success: true })
}
```

---

## 4. Quản Lý Users

### Danh sách users (`/admin/users`):
- Hiển thị tất cả users (Patient, Doctor, Admin)
- Tìm kiếm theo tên, email
- Lọc theo role
- Nút Sửa, Xóa

### Tạo user mới (`/admin/users/create`):
Admin có thể tạo tài khoản cho:
- Bác sĩ mới (role = DOCTOR, điền specialty)
- Bệnh nhân
- Admin khác

### API tạo user:
```typescript
// POST /api/users
export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Tạo auth user trên Supabase
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true
  })

  // Tạo profile trong database
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      email: body.email,
      name: body.name,
      role: body.role,
      specialty: body.specialty || null,
    }
  })

  return NextResponse.json(user)
}
```

### Sửa user (`/admin/users/[id]`):
Admin có thể sửa: tên, role, chuyên khoa, số điện thoại, địa chỉ, mô tả.

---

## 5. ConfirmDeleteModal Component

```typescript
// src/components/ConfirmDeleteModal.tsx
interface Props {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

// Dùng:
<ConfirmDeleteModal
  isOpen={showDeleteModal}
  title="Xóa lịch hẹn"
  message="Hành động này không thể hoàn tác."
  onConfirm={() => deleteAppointment(selectedId)}
  onCancel={() => setShowDeleteModal(false)}
/>
```

---

**Tiếp theo:** [🛡️ Tổng Quan Bảo Mật →](../security/overview.md)
