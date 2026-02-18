# 📅 Luồng Đặt Lịch Hẹn

> **Đọc xong tài liệu này bạn sẽ biết:** Quy trình đầy đủ từ khi bệnh nhân muốn đặt lịch đến khi lịch được lưu vào database.

---

## 1. Tổng Quan Luồng

```
Bệnh nhân vào /book-appointment
          │
          ▼
GET /api/doctors → Hiển thị danh sách bác sĩ
          │
          ▼
Chọn bác sĩ → Chọn ngày → Chọn giờ → Nhập triệu chứng
          │
          ▼
POST /api/appointments → Validate → Lưu DB
          │
          ▼
Redirect về /my-appointments
```

---

## 2. Bước 1: Lấy Danh Sách Bác Sĩ

### API: `GET /api/doctors`

```typescript
// src/app/api/doctors/route.ts
export async function GET() {
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    select: {
      id: true,
      name: true,
      specialty: true,
      description: true,
      image: true,
    }
  })
  
  return NextResponse.json(doctors)
}
```

### Dữ liệu trả về:
```json
[
  {
    "id": "uuid-1",
    "name": "Dr. Nguyễn Văn Nam",
    "specialty": "Cardiology",
    "description": "Chuyên gia tim mạch 15 năm kinh nghiệm",
    "image": "https://..."
  },
  {
    "id": "uuid-2",
    "name": "Dr. Trần Thị Mai",
    "specialty": "Pediatrics",
    "description": "Bác sĩ nhi khoa",
    "image": null
  }
]
```

---

## 3. Bước 2: Form Đặt Lịch

Trang `book-appointment/page.tsx` (Client Component):

```
┌─────────────────────────────────────────┐
│          ĐẶT LỊCH KHÁM BỆNH            │
│                                         │
│  Chọn bác sĩ:  [Dropdown ▼]            │
│  Dr. Nguyễn Văn Nam - Tim mạch          │
│  Dr. Trần Thị Mai - Nhi khoa            │
│                                         │
│  Ngày khám:    [____/____/____]         │
│  Giờ khám:     [HH:MM]                  │
│                                         │
│  Triệu chứng:  [Textarea............]   │
│  (bắt buộc, tối thiểu 3 ký tự)         │
│                                         │
│  Ghi chú:      [Textarea............]   │
│  (không bắt buộc)                       │
│                                         │
│              [Đặt lịch]                 │
└─────────────────────────────────────────┘
```

### State Management trong component:
```typescript
const [doctors, setDoctors] = useState([])
const [selectedDoctor, setSelectedDoctor] = useState('')
const [date, setDate] = useState('')
const [time, setTime] = useState('')
const [symptoms, setSymptoms] = useState('')
const [notes, setNotes] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

// Load doctors khi component mount
useEffect(() => {
  fetch('/api/doctors')
    .then(res => res.json())
    .then(data => setDoctors(data))
}, [])
```

---

## 4. Bước 3: Submit Đặt Lịch

### Client gọi API:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorId: selectedDoctor,
      date: date,         // "2025-12-25"
      time: time,         // "09:00"
      symptoms: symptoms,
      notes: notes
    })
  })
  
  if (response.ok) {
    router.push('/my-appointments')
  } else {
    const err = await response.json()
    setError(err.error || 'Đã có lỗi xảy ra')
  }
  
  setLoading(false)
}
```

---

## 5. Bước 4: API Xử Lý

### `POST /api/appointments`

```typescript
// src/app/api/appointments/route.ts
export async function POST(req: NextRequest) {
  // 1. Rate limiting: 20 requests/minute per IP
  const clientIP = getClientIP(req.headers)
  if (checkRateLimit(clientIP, 20, 60000)) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      { status: 429 }
    )
  }

  // 2. Kiểm tra đăng nhập
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse body
  const body = await req.json()

  // 4. Validate & sanitize
  const validation = validateAppointmentData(body)
  if (!validation.isValid) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', errors: validation.errors },
      { status: 400 }
    )
  }

  // 5. Tạo appointment trong database
  const appointment = await prisma.appointment.create({
    data: {
      patientId: session.user.id,      // Lấy từ session (không tin input!)
      doctorId: validation.sanitized.doctorId,
      date: new Date(validation.sanitized.date),
      time: validation.sanitized.time,
      symptoms: validation.sanitized.symptoms,
      notes: validation.sanitized.notes,
      status: 'PENDING'
    },
    include: {
      doctor: {
        select: { name: true, specialty: true }
      }
    }
  })

  return NextResponse.json(appointment, { status: 201 })
}
```

---

## 6. Validation Logic Chi Tiết

```typescript
// src/lib/security.ts
export function validateAppointmentData(data: any) {
  const errors: string[] = []

  // Kiểm tra doctorId hợp lệ (UUID format)
  if (!data.doctorId || !isValidUUID(data.doctorId)) {
    errors.push('ID bác sĩ không hợp lệ')
  }

  // Kiểm tra ngày: phải là ngày hôm nay hoặc tương lai
  if (!data.date || !isValidFutureDate(data.date)) {
    errors.push('Ngày không hợp lệ hoặc đã qua')
  }

  // Kiểm tra giờ: định dạng HH:MM
  if (!data.time || !isValidTime(data.time)) {
    errors.push('Giờ không đúng định dạng (HH:MM)')
  }

  // Kiểm tra triệu chứng: bắt buộc, tối thiểu 3 ký tự
  if (!data.symptoms || data.symptoms.length < 3) {
    errors.push('Triệu chứng bắt buộc (tối thiểu 3 ký tự)')
  }

  if (errors.length > 0) return { isValid: false, errors }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      doctorId: data.doctorId,
      date: data.date,
      time: data.time,
      symptoms: sanitizeString(data.symptoms),  // Loại bỏ <> để chống XSS
      notes: data.notes ? sanitizeString(data.notes) : '',
    }
  }
}
```

---

## 7. Xem Lịch Hẹn — `/my-appointments`

### API: `GET /api/appointments`

```typescript
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  let appointments

  if (user?.role === 'PATIENT') {
    // Bệnh nhân xem lịch của mình
    appointments = await prisma.appointment.findMany({
      where: { patientId: session.user.id },
      include: {
        doctor: {
          select: { name: true, specialty: true, image: true }
        }
      },
      orderBy: { date: 'desc' }
    })
  } else if (user?.role === 'DOCTOR') {
    // Bác sĩ xem lịch của mình
    appointments = await prisma.appointment.findMany({
      where: { doctorId: session.user.id },
      include: {
        patient: {
          select: { name: true, phone: true }
        }
      },
      orderBy: { date: 'desc' }
    })
  }

  return NextResponse.json(appointments)
}
```

---

## 8. Hủy Lịch Hẹn

### API: `PATCH /api/appointments/[id]`

```typescript
export async function PATCH(req: NextRequest, { params }) {
  const { id } = params
  
  // Validate UUID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
  }

  const body = await req.json()
  const { status } = body

  // Chỉ cho phép các trạng thái hợp lệ
  const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 })
  }

  // Kiểm tra ownership
  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) {
    return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
  }
  
  if (appointment.patientId !== session.user.id) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  // Cập nhật trạng thái
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status }
  })

  return NextResponse.json(updated)
}
```

---

## 9. AppointmentCard Component

Mỗi lịch hẹn hiển thị qua component `AppointmentCard`:

```
┌─────────────────────────────────────────────┐
│ [Ảnh]  Dr. Nguyễn Văn Nam                  │
│        Tim mạch                             │
│                                             │
│  📅 25/12/2025  ⏰ 09:00                   │
│                                             │
│  Triệu chứng: Đau ngực, khó thở            │
│                                             │
│  [● CONFIRMED]          [Xem chi tiết]      │
│                         [Hủy lịch]          │
└─────────────────────────────────────────────┘
```

Status badge màu sắc:
- PENDING → Vàng 🟡
- CONFIRMED → Xanh lá 🟢
- CANCELLED → Đỏ 🔴
- COMPLETED → Xanh dương 🔵

---

**Tiếp theo:** [👨‍⚕️ Dashboard Bác Sĩ →](./doctor-dashboard.md)
