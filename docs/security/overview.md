# 🛡️ Tổng Quan Bảo Mật

> **Đọc xong tài liệu này bạn sẽ biết:** Hệ thống được bảo vệ thế nào, từng cơ chế bảo mật hoạt động ra sao.

---

## 1. Các Lớp Bảo Mật

```
┌─────────────────────────────────────────────────────────────┐
│                      CÁC LỚP BẢO MẬT                        │
│                                                              │
│  Lớp 1: Security Headers (middleware.ts)                    │
│  ├── Chống Clickjacking (X-Frame-Options)                   │
│  ├── Chống MIME sniffing (X-Content-Type-Options)           │
│  ├── Chống XSS (X-XSS-Protection)                          │
│  └── Giới hạn permissions (Permissions-Policy)             │
│                                                              │
│  Lớp 2: Rate Limiting (security.ts + API routes)           │
│  ├── Login: max 10 requests/minute/IP                       │
│  └── Register: max 5 requests/5 minutes/IP                  │
│                                                              │
│  Lớp 3: Input Validation & Sanitization                     │
│  ├── Email format validation                                │
│  ├── UUID format validation                                 │
│  ├── Date/time validation                                   │
│  └── XSS sanitization (loại bỏ < và >)                    │
│                                                              │
│  Lớp 4: Authentication & Authorization                      │
│  ├── JWT tokens (Supabase)                                  │
│  ├── Middleware route protection                            │
│  └── API-level role checks                                  │
│                                                              │
│  Lớp 5: Database (RLS)                                      │
│  ├── Row Level Security policies                            │
│  └── User chỉ đọc/ghi data của mình                       │
│                                                              │
│  Lớp 6: CORS Restriction                                    │
│  └── Chỉ cho phép origins đã whitelist                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Security Headers

Được thêm vào MỌI response qua `middleware.ts`:

```typescript
// src/middleware.ts
res.headers.set('X-Content-Type-Options', 'nosniff')
res.headers.set('X-Frame-Options', 'DENY')
res.headers.set('X-XSS-Protection', '1; mode=block')
res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
```

### Giải thích từng header:

| Header | Chống lại | Giải thích |
|--------|-----------|-----------|
| `X-Content-Type-Options: nosniff` | MIME sniffing | Browser không được đoán MIME type, chỉ dùng Content-Type được khai báo |
| `X-Frame-Options: DENY` | Clickjacking | Không cho website khác nhúng trang này trong iframe |
| `X-XSS-Protection: 1; mode=block` | XSS | Browser tự detect và block XSS attacks |
| `Referrer-Policy: strict-origin-when-cross-origin` | Information leakage | Kiểm soát thông tin Referer được gửi đi |
| `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Abuse | Tắt quyền truy cập camera, mic, GPS |

---

## 3. Rate Limiting

### Cơ chế hoạt động
```typescript
// src/lib/security.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)

  // Nếu chưa có hoặc đã hết window time → reset
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return false  // Chưa vượt giới hạn
  }

  // Đã vượt giới hạn
  if (userLimit.count >= limit) {
    return true
  }

  userLimit.count++
  return false
}
```

### Giới hạn theo từng endpoint:
```typescript
// API Login: 10 requests/phút
checkRateLimit(clientIP, 10, 60000)

// API Register: 5 requests/5 phút
checkRateLimit(clientIP, 5, 5 * 60 * 1000)

// API Appointments: 20 requests/phút
checkRateLimit(clientIP, 20, 60000)
```

### Lấy IP client thực sự:
```typescript
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||  // Behind proxy/CDN
    headers.get('x-real-ip') ||                        // Nginx
    'unknown'
  )
}
```

⚠️ **Hạn chế:** Rate limiting dùng in-memory Map — khi server restart (Vercel cold start) sẽ reset. Trong production cần dùng Redis.

---

## 4. Input Validation & Sanitization

### Email validation:
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

### UUID validation (tránh SQL injection kiểu khác):
```typescript
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
// Nếu id không phải UUID → reject ngay, không query DB
```

### Date validation:
```typescript
export function isValidFutureDate(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return date >= now && !isNaN(date.getTime())
}
// Không cho đặt lịch cho ngày đã qua
```

### XSS Sanitization:
```typescript
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')   // Loại bỏ < và > → chặn HTML injection
    .trim()
    .substring(0, 1000)     // Giới hạn độ dài
}
```

---

## 5. SQL Injection Protection

**Prisma tự động prevent SQL injection** qua parameterized queries:

```typescript
// Prisma tự escape parameters → không bao giờ inject được SQL
const user = await prisma.user.findUnique({
  where: { email: userInput }  // userInput được escape tự động
})

// Tương đương (an toàn):
// SELECT * FROM "User" WHERE email = $1
// với $1 = userInput (đã escape)
```

Kể cả nếu `userInput = "'; DROP TABLE User; --"` → Prisma vẫn xử lý an toàn.

---

## 6. CORS Configuration

```typescript
// middleware.ts — Chỉ áp cho /api/* routes
if (req.nextUrl.pathname.startsWith('/api')) {
  const origin = req.headers.get('origin')
  
  // Whitelist: chỉ cho phép các origin này
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL    // Production domain
  ].filter(Boolean)
  
  // Chỉ set header nếu origin trong whitelist
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers })
  }
}
```

**Tác dụng:** Chặn các website khác gọi API của bạn từ browser (cross-origin requests).

---

## 7. Environment Variables Security

```env
# Public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Anon key - giới hạn bởi RLS

# Private (NEVER expose to browser!)
SUPABASE_SERVICE_ROLE_KEY=...       # Bypass mọi RLS - cực kỳ nguy hiểm nếu lộ
DATABASE_URL=...                     # Kết nối trực tiếp database
DIRECT_URL=...
```

### Quy tắc:
- Biến bắt đầu `NEXT_PUBLIC_` → có thể expose ra browser
- Biến không có prefix → chỉ dùng server-side
- KHÔNG BAO GIỜ dùng `SERVICE_ROLE_KEY` trong client component

---

## 8. Security Check Script

```bash
npm run security-check
# Chạy: node scripts/security-check.js
```

Script này kiểm tra tự động:
- Dependencies có lỗ hổng bảo mật đã biết không?
- Các file quan trọng có tồn tại không?
- Environment variables có được set không?
- Middleware có bật không?

---

## 9. Các Điểm Cần Cải Thiện (Biết để tránh)

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|-----------|
| Rate limiting in-memory | Trung bình | Dùng Redis/Upstash |
| Leaked password (HaveIBeenPwned) | Thấp trên Free | Cần Supabase **Pro**; Free giữ min length ≥ 8 |
| Không có Content Security Policy header | Trung bình | Thêm CSP header |
| Password strength chỉ dựa length | Thấp | Thêm requirement chữ/số trên Dashboard hoặc validate app |
| Session timeout không cấu hình rõ ràng | Thấp | Set explicit expiry |

---

**Tiếp theo:** [🚀 Triển Khai Vercel →](../deployment/vercel.md)
