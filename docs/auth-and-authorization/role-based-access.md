# 👥 Phân Quyền Theo Vai Trò (RBAC)

> **Đọc xong tài liệu này bạn sẽ biết:** RBAC là gì, 3 vai trò có quyền gì, hệ thống kiểm tra quyền thế nào.

---

## 1. RBAC Là Gì?

**RBAC = Role-Based Access Control** = Kiểm soát truy cập dựa trên vai trò.

Thay vì cấp quyền cho từng người (phức tạp), hệ thống cấp quyền theo **nhóm vai trò**. Ai thuộc vai trò nào thì có quyền của vai trò đó.

```
Người dùng → Được gán Vai trò → Vai trò có Quyền hạn
   User    →    Role (PATIENT)  →   Quyền đặt lịch, xem lịch mình
   User    →    Role (DOCTOR)   →   Quyền xem/cập nhật lịch của mình
   User    →    Role (ADMIN)    →   Quyền quản lý toàn hệ thống
```

---

## 2. Bảng Quyền Hạn Chi Tiết

### Routes (URL access)

| Route | PATIENT | DOCTOR | ADMIN |
|-------|---------|--------|-------|
| `/login` | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ |
| `/patient/dashboard` | ✅ | ❌ | ❌ |
| `/book-appointment` | ✅ | ❌ | ❌ |
| `/my-appointments` | ✅ | ❌ | ❌ |
| `/doctor/dashboard` | ❌ | ✅ | ❌ |
| `/admin/dashboard` | ❌ | ❌ | ✅ |
| `/admin/users` | ❌ | ❌ | ✅ |

### API Endpoints

| Endpoint | Method | PATIENT | DOCTOR | ADMIN |
|---------|--------|---------|--------|-------|
| `/api/auth/login` | POST | ✅ | ✅ | ✅ |
| `/api/auth/register` | POST | ✅ | ✅ | ✅ |
| `/api/doctors` | GET | ✅ | ✅ | ✅ |
| `/api/appointments` | GET | ✅ (chỉ của mình) | ✅ (chỉ của mình) | ✅ (tất cả) |
| `/api/appointments` | POST | ✅ | ❌ | ✅ |
| `/api/appointments/[id]` | PATCH | ✅ (chỉ của mình) | ✅ (chỉ của mình) | ✅ |
| `/api/admin/appointments/[id]` | DELETE | ❌ | ❌ | ✅ |
| `/api/users` | POST | ❌ | ❌ | ✅ |

### Thao Tác Với Lịch Hẹn

| Hành động | PATIENT | DOCTOR | ADMIN |
|-----------|---------|--------|-------|
| Tạo lịch hẹn mới | ✅ | ❌ | ✅ |
| Xem lịch hẹn của mình | ✅ | ✅ | ✅ |
| Xem lịch hẹn của người khác | ❌ | ❌ | ✅ |
| Hủy lịch (CANCELLED) | ✅ (chỉ của mình) | ✅ (chỉ của mình) | ✅ |
| Xác nhận (CONFIRMED) | ❌ | ✅ | ✅ |
| Hoàn thành (COMPLETED) | ❌ | ✅ | ✅ |
| Xóa lịch hẹn | ❌ | ❌ | ✅ |

---

## 3. Kiểm Tra Quyền Diễn Ra Ở Đâu?

Hệ thống có **3 tầng kiểm tra quyền**:

```
Request đến
     │
     ▼
┌─────────────────────────┐
│ Tầng 1: MIDDLEWARE      │ ← Chặn truy cập sai route
│ (middleware.ts)          │   theo role
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Tầng 2: API ROUTE CODE  │ ← Kiểm tra nghiệp vụ
│ (api/*/route.ts)         │   (ai sở hữu data)
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Tầng 3: DATABASE RLS    │ ← Lọc data theo policy
│ (Supabase Policies)      │   ở tầng database
└─────────────────────────┘
```

---

## 4. Tầng 1: Middleware Route Protection

```typescript
// src/middleware.ts

// Lấy role từ DB
const { data: userData } = await supabase
  .from('User')
  .select('role')
  .eq('id', session.user.id)
  .single()

// Kiểm tra quyền truy cập từng nhóm route
if (path.startsWith('/admin') && userData?.role !== 'ADMIN') {
  return NextResponse.redirect(new URL('/login', req.url))
}

if (path.startsWith('/doctor') && userData?.role !== 'DOCTOR') {
  return NextResponse.redirect(new URL('/login', req.url))
}

if (path.startsWith('/patient') && userData?.role !== 'PATIENT') {
  return NextResponse.redirect(new URL('/login', req.url))
}
```

**Ví dụ thực tế:**
```
DOCTOR cố truy cập /admin/dashboard
  → Middleware đọc role = 'DOCTOR'
  → path.startsWith('/admin') = true
  → userData.role !== 'ADMIN' = true
  → Redirect về /login
```

---

## 5. Tầng 2: API Route Business Logic

### Ví dụ 1: Chỉ bệnh nhân mới đặt được lịch
```typescript
// src/app/api/appointments/route.ts
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  // Kiểm tra đăng nhập
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  
  // Validate dữ liệu input
  const validation = validateAppointmentData(body)
  if (!validation.isValid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 })
  }
  
  // patientId LUÔN lấy từ session, không tin input từ user
  // (tránh user tạo lịch hẹn nhân danh người khác)
  const appointment = await prisma.appointment.create({
    data: {
      ...validation.sanitized,
      patientId: session.user.id,  // Lấy từ session!
      status: 'PENDING'
    }
  })
  
  return NextResponse.json(appointment)
}
```

### Ví dụ 2: Chỉ admin mới xóa được
```typescript
// src/app/api/admin/appointments/[id]/route.ts
export async function DELETE(req: NextRequest, { params }) {
  // Lấy thông tin người đang gọi API
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Kiểm tra role từ database
  const { data: user } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single()

  // Chỉ ADMIN mới được xóa
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Xóa lịch hẹn
  await prisma.appointment.delete({
    where: { id: params.id }
  })
  
  return NextResponse.json({ success: true })
}
```

### Ví dụ 3: Người dùng chỉ cập nhật lịch của mình
```typescript
// src/app/api/appointments/[id]/route.ts
export async function PATCH(req: NextRequest, { params }) {
  const { id } = params
  
  // Validate UUID format
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // Lấy lịch hẹn từ DB
  const appointment = await prisma.appointment.findUnique({
    where: { id }
  })

  if (!appointment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Kiểm tra ownership: chỉ được sửa lịch của mình
  if (appointment.patientId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Cập nhật trạng thái
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: body.status }
  })
  
  return NextResponse.json(updated)
}
```

---

## 6. Tầng 3: RLS Database Policies

Ngay cả khi API route bỏ sót kiểm tra quyền (lỗi code), RLS vẫn bảo vệ:

```sql
-- Bệnh nhân chỉ xem lịch của mình
CREATE POLICY "Users can view their own appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text);
```

Nếu user_A gọi `SELECT * FROM Appointment` → Database tự lọc, chỉ trả về hàng có `patientId = user_A_id`.

---

## 7. Redirect Theo Role Sau Đăng Nhập

```typescript
// src/app/dashboard/page.tsx
// Trang /dashboard làm nhiệm vụ "dispatcher" - đọc role rồi redirect

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) redirect('/login')
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  // Redirect theo role
  switch (user?.role) {
    case 'ADMIN':   redirect('/admin/dashboard')
    case 'DOCTOR':  redirect('/doctor/dashboard')
    case 'PATIENT': redirect('/patient/dashboard')
    default:        redirect('/login')
  }
}
```

---

## 8. Đăng Ký Role

Khi đăng ký, user chọn role:
- **Giao diện đăng ký** có dropdown: "Tôi là Bệnh nhân / Bác sĩ"
- **ADMIN** không thể tự đăng ký → phải được tạo bởi admin khác (qua `/admin/users/create`)

```typescript
// API register chấp nhận role từ form
role: body.role || 'PATIENT'  // Default là PATIENT
```

⚠️ **Lưu ý bảo mật:** Trong production thực tế, nên verify bác sĩ (ví dụ: xác minh bằng mã của bệnh viện) trước khi cho đăng ký role DOCTOR.

---

**Tiếp theo:** [📅 Luồng Đặt Lịch Hẹn →](../features/booking-flow.md)
