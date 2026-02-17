# Tài liệu bảo mật – Clinic Booking System

Tài liệu này giải thích **lý thuyết**, **nguyên nhân** các lỗ hổng, **cách đã khắc phục**, **quy trình test bảo mật** và **cách xử lý khi bị báo lỗi lại**.
---

## Mục lục

1. [Bắt đầu nhanh](#1-bắt-đầu-nhanh)
2. [Tổng quan dự án bảo mật](#2-tổng-quan-dự-án-bảo-mật)
3. [Lý thuyết: Các loại lỗ hổng thường gặp](#3-lý-thuyết-các-loại-lỗ-hổng-thường-gặp)
4. [Chi tiết lỗ hổng đã sửa trong dự án](#4-chi-tiết-lỗ-hổng-đã-sửa-trong-dự-án)
5. [Thay đổi kỹ thuật chi tiết](#5-thay-đổi-kỹ-thuật-chi-tiết)
6. [Quy trình test bảo mật](#6-quy-trình-test-bảo-mật)
7. [Khi bị báo lỗi bảo mật lại](#7-khi-bị-báo-lỗi-bảo-mật-lại)
8. [Migration / Nâng cấp phiên bản](#8-migration--nâng-cấp-phiên-bản)
9. [Checklist và bảo trì](#9-checklist-và-bảo-trì)
10. [Sự cố bảo mật và biến môi trường](#10-sự-cố-bảo-mật-và-biến-môi-trường)
11. [Tài liệu tham khảo](#11-tài-liệu-tham-khảo)

---

## 1. Bắt đầu nhanh

Sau khi clone hoặc pull code:

```bash
npm install
npx prisma generate
npm run dev
```

Kiểm tra nhanh:

```bash
npm audit          # Phải báo 0 vulnerabilities
npm run security-check   # Phải báo All security checks passed
```

Nếu có báo lỗi, xem mục [7. Khi bị báo lỗi bảo mật lại](#7-khi-bị-báo-lỗi-bảo-mật-lại).

---

## 2. Tổng quan dự án bảo mật

### Đã làm gì

- **Nâng Next.js** từ 14.1.0 lên **15.5.12** (bản đã vá mọi CVE đã biết trong dải 10.x–15.5.9).
- **Bổ sung lớp bảo mật ứng dụng:** security headers, rate limiting, validate & sanitize input, CORS whitelist.
- **Tài liệu và script:** file này + script `npm run security-check` để tự kiểm tra cấu hình.

### Kết quả

| Hạng mục    | Trước    | Sau        |
|-------------|----------|------------|
| Next.js     | 14.1.0   | **15.5.12** |
| React       | 18       | 19         |
| npm audit   | 26+ lỗi  | **0**      |
| Rate limiting | Không | Có (login, register, API) |
| Security headers | Không | Có (XSS, clickjacking, …) |
| Input validation | Tối thiểu | Đầy đủ (email, UUID, date, time) |

---

## 3. Lý thuyết: Các loại lỗ hổng thường gặp

Hiểu **khái niệm** và **nguyên nhân** giúp bạn biết cần test gì và khi có advisory mới thì nên xử lý ra sao.

### 3.1 Denial of Service (DoS)

- **Là gì:** Kẻ tấn công làm server quá tải (CPU, RAM, số request) khiến người dùng thật không dùng được.
- **Nguyên nhân thường gặp:**  
  - Request đặc biệt khiến server xử lý rất lâu (ví dụ deserialization phức tạp).  
  - Không giới hạn số request theo IP → gửi hàng loạt request.  
  - API hoặc Image Optimizer xử lý dữ liệu không giới hạn kích thước/số lượng.
- **Cách giảm thiểu:**  
  - Dùng framework/dependency **đã vá** (ví dụ Next.js 15.5.12).  
  - **Rate limiting** (giới hạn request theo IP/user).  
  - Giới hạn kích thước body, timeout, và cấu hình Image Optimizer an toàn.

### 3.2 Server-Side Request Forgery (SSRF)

- **Là gì:** Ứng dụng bị lừa gửi request từ server ra địa chỉ do kẻ tấn công chỉ định (nội bộ hoặc bên ngoài), dùng để thăm dò mạng, đọc dữ liệu nội bộ.
- **Nguyên nhân:** Ứng dụng nhận URL (hoặc redirect) từ user rồi dùng server đi fetch mà không kiểm tra/whitelist địa chỉ.
- **Trong Next.js:** Lỗi từng có ở Middleware redirect và Server Actions (xử lý URL không an toàn). Cách vá là cập nhật Next.js lên bản patch.
- **Cách giảm thiểu:** Cập nhật framework; không dùng URL từ user để server đi request trừ khi đã validate/whitelist chặt.

### 3.3 Cache Poisoning / Cache Key Confusion

- **Là gì:** Kẻ tấn công làm cache lưu nội dung sai (ví dụ response của user A lại được trả cho user B), hoặc dùng sự nhầm lẫn key cache để ghi đè/đọc dữ liệu không đúng.
- **Nguyên nhân:** Cache key không phân biệt đủ (thiếu user, header, query) hoặc logic tạo key có lỗi.
- **Trong Next.js:** Đã có lỗi ở Image Optimization API và cache. Vá bằng cách nâng Next.js lên bản đã sửa.
- **Cách giảm thiểu:** Dùng bản Next.js đã vá; không cache response có dữ liệu nhạy cảm theo user mà không gắn user vào key.

### 3.4 Authorization Bypass

- **Là gì:** Người không có quyền vẫn truy cập được route hoặc tài nguyên chỉ dành cho role khác (admin, doctor, …).
- **Nguyên nhân:** Middleware hoặc API kiểm tra quyền sai (lỗi logic, lỗi thư viện), hoặc có đường đi vòng không qua kiểm tra.
- **Trong Next.js:** Đã có lỗi trong Middleware. Vá bằng bản Next.js mới.
- **Cách giảm thiểu:** Cập nhật Next.js; luôn kiểm tra session + role ở cả Middleware và từng API/route quan trọng.

### 3.5 Content Injection / XSS (Cross-Site Scripting)

- **Là gì:** Đưa nội dung độc hại (thường là script) vào trang, chạy trên trình duyệt nạn nhân để đánh cắp cookie, session, thao tác thay user.
- **Nguyên nhân:** Hiển thị dữ liệu từ user (form, URL, DB) mà không escape/sanitize; hoặc API nhận input và trả về/reflect mà không lọc.
- **Cách giảm thiểu:** **Sanitize** mọi input (xóa/escape ký tự nguy hiểm như `<`, `>`); dùng security headers (X-XSS-Protection, CSP); validate format (email, UUID, v.v.).

### 3.6 Information Exposure

- **Là gì:** Lộ thông tin không nên lộ: stack trace, path nội bộ, phiên bản framework, dữ liệu debug.
- **Nguyên nhân:** Dev server hoặc error page trả về quá nhiều thông tin; biến môi trường hoặc key bị commit.
- **Cách giảm thiểu:** Tắt/giảm thông tin chi tiết ở production; không commit `.env`; trả lỗi generic cho user, log chi tiết chỉ ở server.

### 3.7 Rate limiting (không phải “lỗ hổng” mà là biện pháp)

- **Là gì:** Giới hạn số request từ một IP (hoặc user) trong một khoảng thời gian.
- **Mục đích:** Chống brute force (đăng nhập, đăng ký), chống spam API, giảm tác hại DoS.
- **Cách làm:** Ở mỗi endpoint nhạy cảm, đếm request theo identifier (IP/user), nếu vượt ngưỡng thì trả 429 và từ chối.

---

## 4. Chi tiết lỗ hổng đã sửa trong dự án

Các lỗ dưới đây đều liên quan **Next.js** (và một số React Server Components). Cách xử lý chung: **nâng Next.js lên 15.5.12** (và giữ dependency khác tương thích). Ngoài ra dự án còn bổ sung rate limiting, validation, headers để giảm rủi ro tương tự trong tương lai.

| Loại / Advisory | Mô tả ngắn | Cách đã xử lý |
|------------------|------------|-------------------------------|
| **DoS với Server Actions** | Request đặc biệt gây tốn tài nguyên khi xử lý Server Actions. | Next.js 15.5.12 + rate limiting API. |
| **DoS với Server Components** | Deserialization request có thể gây CPU/memory spike. | Next.js 15.5.12. |
| **Information exposure (dev server)** | Dev server thiếu kiểm tra origin, có thể lộ thông tin. | Next.js 15.5.12. |
| **Cache Poisoning / Race Condition** | Cache có thể bị đầu độc hoặc điều kiện đua. | Next.js 15.5.12. |
| **Cache Key Confusion (Image Optimization)** | API tối ưu ảnh dùng cache key có thể gây nhầm lẫn. | Next.js 15.5.12 + cấu hình `remotePatterns` rõ ràng. |
| **Content Injection (Image Optimization)** | Có thể inject nội dung qua Image Optimization. | Next.js 15.5.12. |
| **SSRF (Middleware redirect)** | Xử lý redirect trong Middleware có thể bị lợi dụng SSRF. | Next.js 15.5.12. |
| **Authorization Bypass (Middleware)** | Lỗi logic trong Middleware có thể bỏ qua kiểm tra quyền. | Next.js 15.5.12; đồng thời kiểm tra session + role trong code. |
| **DoS (Image Optimizer remotePatterns)** | Cấu hình remotePatterns có thể bị khai thác gây DoS. | Next.js 15.5.12; cấu hình `remotePatterns` tối thiểu cần thiết. |

Tất cả advisory nêu trên nằm trong dải Next.js 10.0.0–15.5.9. Bản **15.5.12** đã chứa bản vá tương ứng.

---

## 5. Thay đổi kỹ thuật chi tiết

### 5.1 Middleware (`src/middleware.ts`)

**Mục đích:** Áp dụng cho mọi request (trừ static): kiểm tra đăng nhập/role và thêm security headers.

**Security headers đã thêm:**

- `X-Content-Type-Options: nosniff` — Trình duyệt không đoán MIME type, giảm risk một số dạng attack.
- `X-Frame-Options: DENY` — Trang không được nhúng trong iframe, chống clickjacking.
- `X-XSS-Protection: 1; mode=block` — Bật bộ lọc XSS cũ của trình duyệt (bổ trợ, không thay CSP).
- `Referrer-Policy: strict-origin-when-cross-origin` — Giới hạn thông tin gửi qua Referer khi chuyển site.
- `Permissions-Policy` — Tắt quyền camera/microphone/geolocation cho trang (trừ khi sau này bạn bật có chủ đích).

**CORS:** Không còn `Access-Control-Allow-Origin: *`. Chỉ set origin khi request đến từ origin nằm trong whitelist (ví dụ `localhost:3000`, `NEXT_PUBLIC_APP_URL`). Preflight (OPTIONS) được xử lý và trả 204.

**Auth:** Sau khi refresh session, middleware kiểm tra path công khai (`/`, `/login`, `/register`). Route còn lại bắt buộc có session; route `/admin`, `/doctor`, `/patient` được kiểm tra đúng role. Không đúng role hoặc chưa đăng nhập thì redirect về login.

### 5.2 Thư viện bảo mật (`src/lib/security.ts`)

**Rate limiting:** Hàm `checkRateLimit(identifier, limit, windowMs)` dùng Map trong bộ nhớ: đếm số lần gọi theo `identifier` (thường là IP) trong khoảng `windowMs`. Vượt `limit` thì trả `true` (nên trả 429). Dự án áp dụng:

- Login: 10 request/phút/IP.
- Register: 5 request/5 phút/IP.
- Appointments GET: 100/phút; POST/PATCH: 50/phút.

**Validation:**

- `isValidEmail` — Regex đơn giản đảm bảo có @ và domain.
- `isValidUUID` — Đúng format UUID (8-4-4-4-12 hex).
- `isValidFutureDate` — Ngày hợp lệ và không trong quá khứ (dùng cho lịch hẹn).
- `isValidTime` — Giờ dạng HH:MM (24h).

**Sanitization:** `sanitizeString` — Loại bỏ `<`, `>`, trim, giới hạn độ dài (1000 ký tự) để giảm XSS và payload quá dài.

**Helpers:** `validateAppointmentData`, `validateRegistrationData` dùng các hàm trên để kiểm tra body API; `getClientIP` lấy IP từ header (x-forwarded-for, x-real-ip) dùng cho rate limit.

### 5.3 API routes

- **Login** (`/api/auth/login`): Gọi `checkRateLimit` với key dạng `login-{IP}`; validate email; sanitize email trước khi gọi Supabase.
- **Register** (`/api/auth/register`): Rate limit `register-{IP}`; dùng `validateRegistrationData` (email, password length, name, phone format).
- **Appointments:** GET/POST/PATCH đều có rate limit theo IP; POST dùng `validateAppointmentData` (doctorId UUID, date, time, symptoms); PATCH kiểm tra `params.id` là UUID và `status` nằm trong whitelist (PENDING, CONFIRMED, CANCELLED, COMPLETED). Mọi string từ user (triệu chứng, ghi chú, tên, …) đều qua sanitize/validation.

### 5.4 Cấu hình Next.js (`next.config.js`)

- **Image:** Dùng `images.remotePatterns` (theo chuẩn Next 15) thay cho `domains`. Chỉ thêm hostname cần thiết (ví dụ Supabase storage), không mở rộng quá để giảm risk DoS/Content Injection từ Image Optimizer.

---

## 6. Quy trình test bảo mật

Làm lần lượt để đảm bảo không bỏ sót. Nên chạy sau mỗi lần sửa security hoặc nâng dependency.

### Bước 1: Kiểm tra dependency (`npm audit`)

```bash
npm audit
```

- **Mục tiêu:** 0 vulnerabilities (0 critical, 0 high, …).
- **Nếu có báo lỗi:** Xem mục [7. Khi bị báo lỗi bảo mật lại](#7-khi-bị-báo-lỗi-bảo-mật-lại).

### Bước 2: Script kiểm tra cấu hình (`npm run security-check`)

```bash
npm run security-check
```

Script kiểm tra:

- `package.json`: Next.js thuộc dải 15.x hoặc 16.x; React đã nâng (18/19).
- `next.config.js`: Dùng `remotePatterns`, bật `reactStrictMode`.
- `src/middleware.ts`: Có security headers, CORS không dùng `*`, có kiểm tra session.
- `src/lib/security.ts`: Có rate limit, sanitize, validation.
- API login/appointments: Có gọi rate limit và validation.

Tất cả check phải pass. Nếu fail, sửa đúng file/cấu hình được script gợi ý.

### Bước 3: Test rate limiting

- **Login:** Mở `/login`, nhập sai email/password, gửi form **khoảng 11 lần liên tiếp trong 1 phút**. Kỳ vọng: sau khoảng 10 lần bắt đầu thấy response 429 hoặc thông báo kiểu “Too many login attempts”.
- **Register:** Tương tự, thử gửi form đăng ký **6 lần trong 5 phút**. Kỳ vọng: lần thứ 6 bị chặn hoặc 429.
- **API:** Nếu có công cụ (Postman, curl), gọi liên tục GET/POST `/api/appointments` (với cookie/session hợp lệ). Sau một số request (theo limit trong code) phải thấy 429.

Nếu không thấy 429 khi vượt ngưỡng → kiểm tra lại `checkRateLimit` và chỗ gọi trong từng route.

### Bước 4: Kiểm tra security headers

1. Chạy `npm run dev`, mở site (ví dụ http://localhost:3000).
2. Mở DevTools (F12) → tab **Network**.
3. Refresh trang, chọn request đầu tiên (document).
4. Xem **Response Headers** (hoặc Headers → Response Headers).

Phải thấy có:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

Nếu thiếu → kiểm tra `src/middleware.ts` có set đủ header và không bị ghi đè ở đâu.

### Bước 5: Test input validation

- **Email:** Ở form đăng ký/đăng nhập, nhập chuỗi không có `@` (ví dụ `abc`). Gửi form. Kỳ vọng: lỗi kiểu “Invalid email format” hoặc 400, không gọi được Supabase với email đó.
- **Password:** Nhập password ngắn (dưới 8 ký tự). Kỳ vọng: bị từ chối (client hoặc server).
- **Đặt lịch:** Nếu có form đặt lịch, thử ngày quá khứ, giờ sai format, hoặc `doctorId` rác. Kỳ vọng: 400 và message lỗi validation, không tạo bản ghi sai.
- **UUID:** Gọi PATCH `/api/appointments/not-a-uuid` với body hợp lệ. Kỳ vọng: 400 (invalid ID), không crash.

### Bước 6: Test phân quyền (Authorization)

- Đăng nhập bằng **patient**. Thử truy cập trực tiếp URL `/admin/dashboard` hoặc `/doctor/dashboard`. Kỳ vọng: redirect về login hoặc trang không được phép.
- Đăng xuất, thử truy cập `/patient/dashboard` (hoặc trang cần đăng nhập). Kỳ vọng: redirect về `/login`.
- Đăng nhập **admin**, truy cập `/admin/dashboard`. Kỳ vọng: vào được.

Nếu vào được admin/doctor bằng tài khoản patient → kiểm tra lại middleware và role trong DB.

### Bước 7: Build production và audit lần cuối

```bash
npm run build
npm audit
```

Build phải thành công; audit vẫn 0. Trước khi deploy lên production nên chạy lại toàn bộ quy trình từ bước 1 đến 7.

---

## 7. Khi bị báo lỗi bảo mật lại

Áp dụng khi GitHub Dependabot, `npm audit`, hoặc bên thứ ba báo vulnerability.

### Bước 1: Xác định gói và mức độ

- Chạy `npm audit` (và nếu dùng `npm audit --json` thì xem chi tiết).
- Ghi lại: **package nào** (ví dụ `next`), **phiên bản hiện tại**, **mức độ** (critical/high/moderate/low).

### Bước 2: Đọc advisory / CVE

- Link trong output `npm audit` thường dẫn tới GitHub Advisory hoặc CVE.
- Đọc **mô tả ngắn** và **phiên bản đã vá** (patched version). Ví dụ: “Affected: next 10.0.0–15.5.9; Fixed: 15.5.12”.

### Bước 3: Nâng phiên bản dependency

- Trong `package.json`, đổi version của package đó sang **bản đã vá** (ví dụ `next` → `15.5.12` hoặc bản mới hơn nếu advisory ghi).
- Nếu advisory khuyên nâng nhiều gói (ví dụ `eslint-config-next` cùng major với `next`), nâng luôn để tránh lệch version.

Ví dụ:

```json
"next": "15.5.12",
"eslint-config-next": "15.5.12"
```

Sau đó:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Bước 4: Kiểm tra tương thích

- Đọc changelog/breaking changes của bản mới (ví dụ Next.js 15.5).
- Chạy `npx prisma generate` (nếu dùng Prisma).
- Chạy `npm run build`. Nếu lỗi type hoặc runtime, sửa code theo hướng dẫn nâng cấp (ví dụ đổi `domains` → `remotePatterns` đã làm trước đó).

### Bước 5: Xác nhận đã hết lỗi

```bash
npm audit
npm run security-check
```

Cho đến khi 0 vulnerabilities và script pass. Sau đó chạy lại [Quy trình test bảo mật](#6-quy-trình-test-bảo-mật) (ít nhất bước 3–6) để đảm bảo hành vi ứng dụng vẫn đúng.

### Lưu ý

- **Không tắt advisory** bằng cách chỉ sửa `package.json` mà không nâng đúng bản đã vá.
- **Không dùng `npm audit fix --force`** tùy tiện vì có thể nâng major và gây vỡ. Ưu tiên đọc advisory và nâng đúng bản được khuyến nghị.
- Nếu bản vá chưa ra (hoặc chỉ có bản canary): theo dõi issue/advisory, tạm thời giảm rủi ro bằng rate limit, validation, giới hạn truy cập mạng (firewall, WAF) nếu có.

---

## 8. Migration / Nâng cấp phiên bản

Khi nâng Next.js (hoặc React) lên bản mới (ví dụ từ 14 lên 15):

1. **Backup:** Commit sạch, tạo nhánh (ví dụ `upgrade-next-15`).
2. **Xóa cache và cài lại:**
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install
   ```
3. **Prisma:** `npx prisma generate`.
4. **Config:** Đổi `images.domains` → `images.remotePatterns` (xem `next.config.js` hiện tại).
5. **Build:** `npm run build`. Sửa lỗi type (ví dụ React 19: `@types/react@^19`, `@types/react-dom@^19`).
6. **Chạy:** `npm run dev`, test tay login/register/đặt lịch và vài flow chính.
7. **Audit:** `npm audit` và `npm run security-check`.

Chi tiết breaking changes theo từng phiên bản xem tại [Next.js Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading) và [React release notes](https://react.dev/blog).

---

## 9. Checklist và bảo trì

### Trước khi deploy production

- [ ] `npm audit` = 0, `npm run security-check` pass.
- [ ] HTTPS bật; biến môi trường (CORS, Supabase, DB) đúng và mạnh; không commit `.env`.
- [ ] Đã test rate limiting, security headers, validation, phân quyền (ít nhất theo mục 6).
- [ ] RLS (Supabase) đã review; xóa hoặc tắt log debug (console.log); backup DB.

### Bảo trì định kỳ

- **Hàng tuần:** `npm outdated` — xem gói nào có bản mới, đọc changelog trước khi nâng.
- **Hàng tháng:** `npm audit`; xem log lỗi và access log bất thường.
- **Hàng quý:** Review lại security (dependency, CORS, rate limit, RLS, backup).

---

## 10. Sự cố bảo mật và biến môi trường

### Sự cố bảo mật (Incident response)

- **Không** mở issue công khai mô tả chi tiết lỗ hổng.
- Báo qua kênh riêng (ví dụ email security@yourdomain.com) kèm: mô tả ngắn, bước tái hiện, mức ảnh hưởng, và nếu có thì hướng sửa hoặc link CVE/advisory.

### Biến môi trường

- **Không commit:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, và mọi secret khác.
- **Dev:** Dùng `.env.local`, đã được `.gitignore`.
- **Production:** Dùng biến môi trường của host (Vercel, Railway, …) hoặc secret manager (AWS Secrets Manager, …), không hardcode trong code.

---

## 11. Tài liệu tham khảo

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Mười rủi ro bảo mật ứng dụng web phổ biến.
- [Next.js – Configuring Security](https://nextjs.org/docs/app/building-your-application/configuring/security) — Security headers, CSP, và best practices Next.js.
- [Supabase – Security](https://supabase.com/docs/guides/platform/security) — RLS, auth, và bảo mật Supabase.
- [GitHub Advisories / npm audit](https://github.com/advisories) — Tra CVE và advisory theo package.

---

**Cập nhật:** 2026 · Next.js 15.5.12 · 0 vulnerabilities (sau khi áp dụng tài liệu này và chạy `npm audit`).
