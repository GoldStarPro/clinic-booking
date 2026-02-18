# 👨‍⚕️ Dashboard Bác Sĩ

> **Đọc xong tài liệu này bạn sẽ biết:** Bác sĩ thấy gì, làm được gì trong hệ thống.

---

## 1. Tổng Quan Dashboard Bác Sĩ

URL: `/doctor/dashboard`  
Chỉ người có role = `DOCTOR` mới truy cập được.

### Giao diện chính:
```
┌──────────────────────────────────────────────────────────┐
│  🏥 Clinic Booking    [Dr. Nguyễn Văn Nam]  [Logout]     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  [Tổng bệnh nhân: 45]  [Hôm nay: 3]  [Hoàn thành: 38]  │
│                                                           │
│  ─────────────────────────────────────────────────────   │
│                                                           │
│  Lọc theo:  [Tất cả ▼]    Tìm kiếm: [___________]       │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Trần Thị Lan  │ 25/12/2025 09:00  │ ● PENDING     │   │
│  │ "Đau ngực..."  │                  │ [Xác nhận][Hủy]│   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Nguyễn Văn A  │ 26/12/2025 14:00  │ ● CONFIRMED   │   │
│  │ "Khó thở..."   │                  │ [Hoàn thành]   │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Thống Kê (Stats Cards)

```typescript
// Tính toán thống kê từ danh sách appointments
const stats = {
  totalPatients: appointments.length,
  todayAppointments: appointments.filter(a => {
    const today = new Date().toDateString()
    return new Date(a.date).toDateString() === today
  }).length,
  completedAppointments: appointments.filter(
    a => a.status === 'COMPLETED'
  ).length,
  pendingAppointments: appointments.filter(
    a => a.status === 'PENDING'
  ).length,
}
```

---

## 3. Lọc Lịch Hẹn

Bác sĩ có thể lọc theo trạng thái:

```typescript
const [filter, setFilter] = useState('ALL')

const filteredAppointments = appointments.filter(appt => {
  if (filter === 'ALL') return true
  return appt.status === filter
})
```

Các filter: `ALL | PENDING | CONFIRMED | COMPLETED | CANCELLED`

---

## 4. Cập Nhật Trạng Thái Lịch Hẹn

Bác sĩ có thể:

| Nút | Hành động | Status thay đổi |
|-----|-----------|----------------|
| Xác nhận | PATCH /api/appointments/[id] | PENDING → CONFIRMED |
| Hủy lịch | PATCH /api/appointments/[id] | ANY → CANCELLED |
| Hoàn thành | PATCH /api/appointments/[id] | CONFIRMED → COMPLETED |

```typescript
const updateStatus = async (appointmentId: string, newStatus: string) => {
  const response = await fetch(`/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
  
  if (response.ok) {
    // Cập nhật state local để UI phản ánh ngay
    setAppointments(prev => 
      prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a)
    )
  }
}
```

---

## 5. Xem Chi Tiết Lịch Hẹn

Khi nhấn "Xem chi tiết" → `AppointmentDetailModal` hiện lên:

```
┌──────────────────────────────────────────┐
│         CHI TIẾT LỊCH HẸN               │
│                                          │
│  Bệnh nhân: Trần Thị Lan                │
│  SĐT: 0987654321                         │
│                                          │
│  Ngày: 25/12/2025                        │
│  Giờ: 09:00                              │
│                                          │
│  Triệu chứng:                            │
│  "Đau ngực khi gắng sức, khó thở..."    │
│                                          │
│  Ghi chú:                                │
│  "Đã dùng thuốc huyết áp 3 tháng"      │
│                                          │
│  Trạng thái: ● PENDING                  │
│                                          │
│              [Đóng]                      │
└──────────────────────────────────────────┘
```

---

## 6. Doctor Layout

`doctor/layout.tsx` bao gồm:
- Header với tên bác sĩ
- Theme switcher (sky blue)
- Nút logout

---

**Tiếp theo:** [⚙️ Quản Lý Admin →](./admin-management.md)
