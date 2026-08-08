# 🔑 Biến Môi Trường (.env)

> **Đọc xong tài liệu này bạn sẽ biết:** Từng biến môi trường làm gì, lấy ở đâu, và setup thế nào.

---

## 1. File `.env` Hiện Tại

```env
# ================================
# SUPABASE CONFIGURATION
# ================================

# URL project Supabase của bạn
# Lấy từ: Supabase Dashboard → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Publishable key (an toàn để expose ra browser). Giữ tên biến ANON_KEY trong code.
# Lấy từ: Settings → API Keys → Publishable (`sb_publishable_...`)
# Legacy JWT `anon` (`eyJ...`) vẫn chạy song song đến khi tắt.
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# Secret / service role (NGUY HIỂM - chỉ server-side!). Bypass RLS.
# Lấy từ: Settings → API Keys → Secret (`sb_secret_...`). Local dùng key `default`, Vercel dùng `vercel_production`.
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# ================================
# DATABASE CONNECTION
# ================================

# Pooled connection (dùng cho queries trong Vercel/Serverless)
# Lấy từ: Supabase Dashboard → Settings → Database → Connection Pooling
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (dùng cho prisma migrate)
# Lấy từ: Supabase Dashboard → Settings → Database → Connection string
DIRECT_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# ================================
# APP CONFIGURATION
# ================================

# URL app (CORS whitelist). Local: http://localhost:3000 — Production: https://cbs.goldhoang.dev
NEXT_PUBLIC_APP_URL=https://cbs.goldhoang.dev
```

---

## 2. Giải Thích Chi Tiết Từng Biến

### `NEXT_PUBLIC_SUPABASE_URL`
```
Loại: Public (NEXT_PUBLIC_ prefix)
Dùng ở: Cả client (browser) và server
Mô tả: Địa chỉ Supabase project của bạn

Ví dụ: https://abcdefghij.supabase.co
```

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```
Loại: Public (NEXT_PUBLIC_ prefix)
Dùng ở: Cả client và server
Mô tả: Publishable key (`sb_publishable_...`) — vẫn giữ tên biến ANON_KEY trong code
Lưu ý: Giới hạn bởi RLS. Tab Legacy JWT `anon` (`eyJ...`) chỉ để rollback.
```

### `SUPABASE_SERVICE_ROLE_KEY`
```
Loại: Private (KHÔNG có NEXT_PUBLIC_)
Dùng ở: CHỈ server-side (seed, POST /api/admin/users, Prisma admin)
Mô tả: Secret key `sb_secret_...` (bypass RLS). Local = key tên default; Vercel = vercel_production.
⚠️ NGUY HIỂM: Không bao giờ đưa vào Client Component / NEXT_PUBLIC_
```

### `DATABASE_URL`
```
Loại: Private
Dùng ở: Prisma Client (queries)
Mô tả: Kết nối database qua PgBouncer (connection pooling)
Lưu ý: Có ?pgbouncer=true ở cuối URL
```

### `DIRECT_URL`
```
Loại: Private
Dùng ở: Prisma Migrate
Mô tả: Kết nối trực tiếp database, không qua pooler
Tại sao cần: prisma migrate cần persistent connection, pooler không hỗ trợ
```

### `NEXT_PUBLIC_APP_URL`
```
Loại: Public
Dùng ở: CORS whitelist trong middleware
Mô tả: Domain production của app
Ví dụ: https://clinic-booking.vercel.app
```

---

## 3. Cách Lấy Từng Giá Trị

### Từ Supabase Dashboard

1. Đăng nhập [supabase.com](https://supabase.com)
2. Chọn project → **Settings** → **API**

```
Project URL    → NEXT_PUBLIC_SUPABASE_URL
anon/public    → NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role   → SUPABASE_SERVICE_ROLE_KEY
```

3. **Settings** → **Database** → **Connection Pooling**
```
Connection string (mode: Transaction) → DATABASE_URL
Connection string (direct)           → DIRECT_URL
```

---

## 4. Cách Dùng Trong Code

### Trong Client Component (browser):
```typescript
// Chỉ dùng NEXT_PUBLIC_ variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// ✅ An toàn - biến này intentionally public
```

### Trong Server Component / API Route:
```typescript
// Có thể dùng private variables
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dbUrl = process.env.DATABASE_URL
// ✅ An toàn - chỉ chạy trên server, không gửi về browser
```

### Sai (NGUY HIỂM!):
```typescript
// ❌ ĐỪNG BAO GIỜ làm thế này trong Client Component!
'use client'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Biến này sẽ là undefined (Next.js không expose private vars về browser)
// Nhưng nếu bạn vô tình dùng NEXT_PUBLIC_ cho service key → LỘ BÍ MẬT!
```

---

## 5. Setup Cho Development

```bash
# 1. Copy file mẫu
cp .env.example .env

# 2. Điền giá trị thực vào .env
# (Xem hướng dẫn lấy giá trị ở trên)

# 3. Không bao giờ commit .env!
# File .gitignore đã có: .env*.local và .env
```

---

## 6. Setup Cho Production (Vercel)

Không dùng file `.env` khi deploy Vercel. Thay vào đó:

1. Vercel Dashboard → Project → Settings → **Environment Variables**
2. Thêm từng biến:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL`
3. Chọn environments: Production, Preview, Development

---

## 7. `.gitignore` — Đảm Bảo Không Commit Secrets

```gitignore
# .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

File `.env.example` (có trong repo) là template trống — an toàn để commit.

---

**Tiếp theo:** [⚖️ So Sánh Kiến Trúc →](../architecture-comparison/monolith-vs-separated.md)
