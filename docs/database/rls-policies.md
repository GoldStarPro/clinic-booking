# 🔒 Row Level Security (RLS) Policies

> **Câu hỏi được giải đáp:** *"Policies là gì? Áp lên database thế nào? Tại sao cần?"*

---

## 1. RLS Là Gì? — Giải Thích Dễ Hiểu

### Tình huống không có RLS (Nguy hiểm!)

Tưởng tượng bạn có bảng Appointment:
```
| id  | patientId | doctorId | symptoms          |
|-----|-----------|----------|-------------------|
| 001 | user_A    | doc_1    | "Đau dạ dày"      |
| 002 | user_B    | doc_1    | "Tiểu đường"      |
| 003 | user_C    | doc_2    | "Huyết áp cao"    |
```

Nếu user_A gọi API: `GET /api/appointments`  
→ Không có RLS: user_A thấy **TẤT CẢ** lịch hẹn của mọi người!  
→ Lỗi bảo mật nghiêm trọng (data leak)

### Tình huống có RLS (An toàn!)

Với RLS, bạn định nghĩa **policy**:
> "Người dùng chỉ được SELECT những hàng có `patientId = auth.uid()`"

Khi user_A query: `SELECT * FROM Appointment`  
→ Database **tự động lọc** chỉ trả về hàng của user_A  
→ user_A không thể thấy dữ liệu của user_B dù có muốn

**RLS = Bảo vệ ngay tại tầng database, không phụ thuộc vào code API**

---

## 2. Các Khái Niệm Cơ Bản

### `auth.uid()` — Ai đang đăng nhập?
Hàm này trả về ID của user đang thực hiện request, được lấy từ JWT token.

### Các role trong Supabase
| Role | Mô tả |
|------|-------|
| `anon` | Người dùng chưa đăng nhập (anonymous) |
| `authenticated` | Người dùng đã đăng nhập |
| `service_role` | Admin role (server-side), bypass mọi policy |

### Cú pháp Policy
```sql
CREATE POLICY "Tên policy mô tả rõ"
ON "TênBảng"
FOR [SELECT | INSERT | UPDATE | DELETE | ALL]
TO [anon | authenticated | service_role]
USING (điều_kiện_đọc)              -- Áp cho SELECT, UPDATE, DELETE
WITH CHECK (điều_kiện_ghi);       -- Áp cho INSERT, UPDATE
```

---

## 3. Policies Hiện Tại Trong Dự Án

### Bảng `User`

#### Policy 1: Service role toàn quyền
```sql
CREATE POLICY "Service role can do everything" 
ON "User" 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
```
**Ý nghĩa:** Server-side code (dùng `SUPABASE_SERVICE_ROLE_KEY`) có thể làm mọi thứ — tạo, đọc, sửa, xóa bất kỳ user nào.

Đây là cách API routes trong Next.js thao tác với database mà không bị giới hạn bởi policy user.

#### Policy 2: Ai cũng có thể đăng ký
```sql
CREATE POLICY "Enable insert for all users" 
ON "User" 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);
```
**Ý nghĩa:** Người chưa đăng nhập (`anon`) vẫn có thể tạo user mới → cần thiết cho chức năng đăng ký.

#### Policy 3: Mọi người xem được thông tin bác sĩ
```sql
CREATE POLICY "Enable read access for all users" 
ON "User" 
FOR SELECT 
TO anon, authenticated
USING (role = 'DOCTOR'::"Role");
```
**Ý nghĩa:** Ai cũng xem được danh sách bác sĩ (tên, chuyên khoa) — không cần đăng nhập. Nhưng chỉ thấy users có role = DOCTOR.

#### Policy 4: Admin quản lý tất cả
```sql
CREATE POLICY "Admin can manage all users" 
ON "User" 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);
```
**Ý nghĩa:** User đã đăng nhập có thể đọc/sửa/xóa bất kỳ user nào.

⚠️ **Lưu ý:** Policy này hiện rộng hơn cần thiết — mọi authenticated user đều có quyền admin level. Đây là điểm cần cải thiện (xem [📈 Lộ Trình Nâng Cấp](../architecture-comparison/upgrade-roadmap.md)).

Trong thực tế, kiểm tra quyền admin được thực hiện ở tầng **API routes** (middleware + code), không chỉ dựa vào RLS.

#### Policy 5: User quản lý dữ liệu của mình
```sql
CREATE POLICY "Users can manage their own data" 
ON "User" 
FOR ALL 
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);
```
**Ý nghĩa:** User chỉ có thể sửa/xóa thông tin của chính mình.

---

### Bảng `Appointment`

#### Policy 1: Service role toàn quyền
```sql
CREATE POLICY "Service role can do everything" 
ON "Appointment" 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
```
Tương tự bảng User — server code có toàn quyền.

#### Policy 2: Admin xem tất cả
```sql
CREATE POLICY "Admin can view all appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING (true);
```
**Ý nghĩa:** Mọi authenticated user có thể xem tất cả appointments.

#### Policy 3: Bác sĩ xem lịch của mình
```sql
CREATE POLICY "Doctors can view their appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING (
  "doctorId" = auth.uid()::text 
  AND (auth.jwt() ->> 'role'::text) = 'DOCTOR'::text
);
```
**Ý nghĩa:** Chỉ bác sĩ mới xem được lịch hẹn mà mình là bác sĩ phụ trách, và phải có role = DOCTOR trong JWT token.

#### Policy 4: Bác sĩ cập nhật trạng thái
```sql
CREATE POLICY "Doctors can update appointment status" 
ON "Appointment" 
FOR UPDATE 
TO authenticated
USING (
  "doctorId" = auth.uid()::text 
  AND (auth.jwt() ->> 'role'::text) = 'DOCTOR'::text
)
WITH CHECK (
  "doctorId" = auth.uid()::text 
  AND (auth.jwt() ->> 'role'::text) = 'DOCTOR'::text
);
```
**Ý nghĩa:** Bác sĩ có thể cập nhật (confirm/cancel/complete) lịch hẹn của mình.

#### Policy 5: Bệnh nhân tạo lịch hẹn
```sql
CREATE POLICY "Users can create appointments" 
ON "Appointment" 
FOR INSERT 
TO authenticated
WITH CHECK ("patientId" = auth.uid()::text);
```
**Ý nghĩa:** Khi tạo lịch hẹn, `patientId` phải bằng ID của người đang đăng nhập. Không thể tạo lịch hẹn nhân danh người khác.

#### Policy 6: Patient và Doctor cập nhật lịch của mình
```sql
CREATE POLICY "Users can update their own appointments" 
ON "Appointment" 
FOR UPDATE 
TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text);
```

#### Policy 7: Xem lịch của mình
```sql
CREATE POLICY "Users can view their own appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text);
```

---

## 4. Sơ Đồ Quyền Hạn

```
                    BẢNG USER
┌─────────────────────────────────────────────────────┐
│                                                      │
│  Ai có thể làm gì với bảng User?                    │
│                                                      │
│  Đọc (SELECT):                                       │
│  ├── anon + authenticated → chỉ xem DOCTOR          │
│  └── authenticated → xem tất cả (policy rộng)       │
│                                                      │
│  Tạo (INSERT):                                       │
│  └── anon + authenticated → tạo được (đăng ký)      │
│                                                      │
│  Sửa (UPDATE):                                       │
│  └── authenticated → chỉ sửa data của mình          │
│                                                      │
│  Xóa (DELETE):                                       │
│  └── authenticated → chỉ xóa data của mình          │
│                                                      │
│  Toàn quyền:                                         │
│  └── service_role → làm mọi thứ                     │
└─────────────────────────────────────────────────────┘

                  BẢNG APPOINTMENT
┌─────────────────────────────────────────────────────┐
│                                                      │
│  Đọc (SELECT):                                       │
│  ├── Doctor → chỉ xem lịch mình là bác sĩ           │
│  ├── Patient → chỉ xem lịch mình là bệnh nhân       │
│  └── Admin → xem tất cả                             │
│                                                      │
│  Tạo (INSERT):                                       │
│  └── authenticated → patientId phải = auth.uid()    │
│                                                      │
│  Sửa (UPDATE):                                       │
│  ├── Doctor → sửa lịch của mình                     │
│  └── Patient → sửa lịch của mình                   │
│                                                      │
│  Xóa (DELETE):                                       │
│  └── service_role → Admin xóa qua API               │
│                                                      │
│  Toàn quyền:                                         │
│  └── service_role → làm mọi thứ                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. Cách Áp Policies Lên Database

### Bước 1: Viết file SQL
File tại `supabase/migrations/20240424000000_update_schema.sql`

### Bước 2: Chạy trên Supabase Dashboard
1. Vào Supabase Dashboard → SQL Editor
2. Copy toàn bộ nội dung file SQL
3. Chạy (Run)

Hoặc dùng Supabase CLI:
```bash
supabase db push
```

### Bước 3: Kiểm tra
Vào **Authentication → Policies** trong Supabase Dashboard để xem policies đã được tạo.

---

## 6. RLS vs Code Validation — Tầng Bảo Vệ Kép

Project này có **2 tầng bảo vệ**:

```
Request từ User
      │
      ▼
Tầng 1: API Route Code
├── Rate limiting (chặn spam)
├── Input validation (kiểm tra định dạng)
├── Session check (đã đăng nhập chưa?)
└── Role check (có quyền không?)
      │
      ▼
Tầng 2: Supabase RLS
└── Database chỉ trả về data user đó được phép thấy
```

**Tại sao cần cả 2?**
- Code validation: linh hoạt, thông báo lỗi rõ ràng
- RLS: bảo vệ ngay cả khi code bị lỗi logic
- Bảo mật theo chiều sâu (Defense in Depth)

---

## 7. Lịch Sử Thay Đổi Policies

Policies đã thay đổi 3 lần trong quá trình phát triển:

| File | Vấn đề | Giải pháp |
|------|--------|-----------|
| `20240320000000_initial_schema.sql` | Policy ban đầu, đơn giản | Tất cả authenticated user đọc được hết |
| `20240321000000_policies.sql` | Cần phân quyền rõ hơn | Thêm service_role bypass |
| `20240424000000_update_schema.sql` | Doctor cần xem lịch của mình | Thêm JWT role check cho Doctor |

**Bài học:** Policies thường phải tinh chỉnh nhiều lần. Đây là chuyện bình thường khi phát triển hệ thống phức tạp.

---

**Tiếp theo:** [🔄 Supabase vs Prisma →](./supabase-and-prisma.md)
