# 🔐 Luồng Xác Thực (Authentication)

> **Đọc xong tài liệu này bạn sẽ biết:** Đăng nhập/đăng ký hoạt động thế nào, session được lưu ở đâu, middleware bảo vệ routes ra sao.

---

## 1. Tổng Quan Authentication

Project dùng **Supabase Auth** — một hệ thống xác thực hoàn chỉnh. Bạn không cần tự mã hóa password, quản lý token — Supabase lo hết.

```
Supabase Auth cung cấp:
✅ Đăng ký với email + password
✅ Đăng nhập với email + password
✅ JWT token tự động
✅ Session refresh tự động
✅ Lưu session trong cookie (httpOnly, bảo mật)
```

---

## 2. Luồng Đăng Ký

```
User điền form         API Route               Supabase           Database
  /register           /api/auth/register       Auth               (Prisma)
     │                      │                    │                    │
     │ POST {email,          │                    │                    │
     │  password, name,      │                    │                    │
     │  role}                │                    │                    │
     │──────────────────────►│                    │                    │
     │                       │                    │                    │
     │                       │ 1. Validate input  │                    │
     │                       │   (validateRegistrationData)           │
     │                       │                    │                    │
     │                       │ 2. Rate limit check│                    │
     │                       │   (max 5 req/5min) │                    │
     │                       │                    │                    │
     │                       │ 3. Supabase Auth   │                    │
     │                       │    signUp()        │                    │
     │                       │───────────────────►│                    │
     │                       │                    │ Tạo auth.users     │
     │                       │                    │ row với email+hash │
     │                       │◄───────────────────│                    │
     │                       │  { user, session } │                    │
     │                       │                    │                    │
     │                       │ 4. Tạo User profile│                    │
     │                       │    (prisma.user.create)                 │
     │                       │────────────────────────────────────────►│
     │                       │                    │                    │
     │                       │◄────────────────────────────────────────│
     │                       │    User object      │                    │
     │                       │                    │                    │
     │ 5. Trả về user data   │                    │                    │
     │◄──────────────────────│                    │                    │
     │                       │                    │                    │
     │ 6. Redirect /login    │                    │                    │
```

### Code thực tế trong `api/auth/register/route.ts`:

```typescript
export async function POST(req: NextRequest) {
  const clientIP = getClientIP(req.headers)
  
  // 1. Rate limiting: 5 requests per 5 minutes per IP
  if (checkRateLimit(clientIP, 5, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  
  // 2. Validate & sanitize input
  const validation = validateRegistrationData(body)
  if (!validation.isValid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 })
  }

  const { email, password, name, phone, address } = validation.sanitized

  // 3. Tạo auth user trên Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: body.role || 'PATIENT' }
    }
  })

  // 4. Tạo user profile trong database
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,   // Dùng cùng ID với auth.users!
      email,
      name,
      role: body.role || 'PATIENT',
      phone: phone || '',
      address: address || '',
    }
  })

  return NextResponse.json({ user }, { status: 201 })
}
```

---

## 3. Luồng Đăng Nhập

```
User          API Route             Supabase          Database
/login      /api/auth/login          Auth             (Prisma)
  │               │                    │                  │
  │ POST {email,  │                    │                  │
  │  password}    │                    │                  │
  │──────────────►│                    │                  │
  │               │ 1. Validate input  │                  │
  │               │ 2. Rate limit (10/min)               │
  │               │ 3. signInWithPassword()               │
  │               │───────────────────►│                  │
  │               │                    │ Verify password  │
  │               │                    │ hash             │
  │               │◄───────────────────│                  │
  │               │  { session, user } │                  │
  │               │                    │                  │
  │               │ 4. Lấy user profile│                  │
  │               │    (prisma.user.   │                  │
  │               │     findUnique)    │                  │
  │               │────────────────────────────────────►  │
  │               │                    │                  │
  │               │◄────────────────────────────────────  │
  │               │    { role, name... }│                  │
  │               │                    │                  │
  │ 5. Trả về user│                    │                  │
  │◄──────────────│                    │                  │
  │               │                    │                  │
  │ 6. Cookie được set bởi Supabase (httpOnly)            │
  │ 7. JS redirect sang dashboard theo role               │
```

---

## 4. Session Hoạt Động Thế Nào?

### JWT Token
Sau khi đăng nhập, Supabase tạo **JWT (JSON Web Token)**:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjE3MDAwMDAwMDB9
.signature
```

JWT chứa (sau khi decode):
```json
{
  "sub": "11111111-1111-1111-1111-111111111111",  // User ID
  "email": "user@example.com",
  "role": "authenticated",                         // Supabase role
  "exp": 1700000000                                // Hết hạn
}
```

### Cookie Storage
JWT được lưu trong **httpOnly cookie** — trình duyệt không thể đọc bằng JavaScript → bảo vệ khỏi XSS.

Cookie tên: `sb-[project-id]-auth-token`

### Session Refresh
Token JWT có hạn (thường 1 giờ). Middleware gọi `getSession()` để tự động gia hạn:

```typescript
// middleware.ts
await supabase.auth.getSession()
// Nếu token gần hết hạn → tự gia hạn
// Nếu có refresh token → đổi lấy token mới
```

---

## 5. Middleware — "Người Gác Cổng"

File `src/middleware.ts` chạy trước **MỌI request**. Đây là luồng xử lý:

```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // BƯỚC 1: Thêm security headers (luôn làm, mọi request)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  // ...

  // BƯỚC 2: Refresh session
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // BƯỚC 3: Public paths → không cần check thêm
  const publicPaths = ['/login', '/register', '/']
  if (publicPaths.includes(path)) {
    return res
  }

  // BƯỚC 4: Check session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // Chưa đăng nhập → về login
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // BƯỚC 5: Lấy role từ database
  const { data: userData } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single()

  // BƯỚC 6: Kiểm tra quyền truy cập route
  if (path.startsWith('/admin') && userData?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (path.startsWith('/doctor') && userData?.role !== 'DOCTOR') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (path.startsWith('/patient') && userData?.role !== 'PATIENT') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}
```

### Bảng Quyết Định Middleware

| Scenario | Kết quả |
|----------|---------|
| Chưa login → `/patient/dashboard` | Redirect `/login` |
| PATIENT login → `/admin/dashboard` | Redirect `/login` |
| DOCTOR login → `/doctor/dashboard` | Cho qua ✅ |
| ADMIN login → `/admin/users` | Cho qua ✅ |
| Chưa login → `/login` | Cho qua ✅ (public) |
| Chưa login → `/register` | Cho qua ✅ (public) |

---

## 6. Luồng Đăng Xuất

```typescript
// Trong trang dashboard, khi nhấn nút Logout:
const handleLogout = async () => {
  await supabase.auth.signOut()
  // Supabase xóa cookie
  router.push('/login')
}
```

Supabase tự xóa cookie session → các request tiếp theo sẽ bị middleware chặn.

---

## 7. Sơ Đồ Tổng Hợp

```
Người dùng chưa đăng nhập
          │
          ▼
    Truy cập URL
          │
          ▼
     Middleware
     ├── /login, /register → Cho qua
     └── Bất kỳ route bảo vệ → Redirect /login
          │
          ▼
     Trang /login
     User điền email + password
          │
          ▼
     POST /api/auth/login
     Supabase signInWithPassword()
          │
          ▼
     Cookie set (httpOnly JWT)
          │
          ▼
     Lấy role từ DB (Prisma)
          │
    ┌─────┴───────┐
    │             │
   PATIENT     DOCTOR/ADMIN
    │             │
    ▼             ▼
/patient/    /doctor/ hoặc
dashboard    /admin/dashboard

Mọi request tiếp theo:
  - Middleware đọc cookie → lấy session
  - Kiểm tra role → cho/chặn access
```

---

**Tiếp theo:** [👥 Phân Quyền Theo Vai Trò →](./role-based-access.md)
