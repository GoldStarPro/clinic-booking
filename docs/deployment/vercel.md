# 🚀 Triển Khai Lên Vercel

> **Câu hỏi được giải đáp:** *"Tại sao project Next.js này deploy được lên Vercel? Vercel xử lý FE và BE thế nào?"*

---

## 1. Vercel Là Gì?

Vercel là **nền tảng cloud** được thiết kế đặc biệt cho Next.js (họ cũng là team tạo ra Next.js). Khi deploy:

```
GitHub Repository
      │
      │  (mỗi khi push code)
      ▼
   Vercel
   ├── Build Next.js app
   ├── Phân tách thành các loại:
   │   ├── Static files → CDN (nhanh, toàn cầu)
   │   ├── Server Components → Edge Functions
   │   └── API Routes → Serverless Functions (AWS Lambda)
   └── Cấp domain HTTPS tự động
```

---

## 2. Serverless Functions — Cách BE Chạy Trên Vercel

Đây là câu trả lời cho *"Sao API routes chạy được trên Vercel?"*

### Serverless là gì?
Thay vì có 1 server chạy 24/7, **Serverless** = mỗi request tạo ra 1 "mini server" tạm thời:

```
Request đến /api/appointments
      │
      ▼
Vercel tạo function instance (trong ~100ms)
      │
      ▼
Function xử lý request
      │
      ▼
Function xong việc → TỰ TẮT (không giữ tài nguyên)
      │
      ▼
Trả response về client
```

### Lợi ích:
- **Tự scale**: 1000 requests đồng thời → 1000 function instances
- **Tiết kiệm**: Chỉ trả tiền cho thời gian xử lý thực
- **Không lo server**: Vercel tự quản lý infrastructure

### Giới hạn:
- **Timeout**: 10 giây (Free tier), 60 giây (Pro)
- **Cold start**: Function đang "ngủ" cần ~100ms để khởi động
- **Không có state**: Mỗi invocation độc lập (không dùng được Memory store lâu dài)
- **Không WebSocket**: Serverless không giữ connection

---

## 3. Build Process

Khi Vercel build, lệnh chạy:
```bash
prisma generate && next build
```

**Tại sao cần `prisma generate` trước?**
Prisma cần generate TypeScript client từ schema. Nếu thiếu bước này, code sẽ lỗi vì `PrismaClient` chưa được tạo.

### Quá trình build:
```
1. prisma generate
   → Tạo @prisma/client với đầy đủ types từ schema.prisma
   
2. next build
   → Compile TypeScript → JavaScript
   → Bundle React components
   → Tạo static pages
   → Analyze API routes → Serverless functions
   → Tối ưu hình ảnh
   
3. Output .next/
   ├── static/    → files upload lên CDN
   ├── server/    → Server components
   └── functions/ → Serverless functions (API routes)
```

---

## 4. Kết Nối Database Từ Vercel

Vercel serverless functions ở nhiều regions. Database connection cần cẩn thận:

### Vấn đề: Connection exhaustion
```
Vercel có thể tạo ra hàng trăm function instances
→ Mỗi instance tạo 1 database connection
→ PostgreSQL chỉ cho phép ~100 connections đồng thời
→ Lỗi "Too many connections"!
```

### Giải pháp: Connection Pooling

Project dùng **Supabase Pooler** (PgBouncer):
```env
# Pooled connection (qua PgBouncer, port 6543)
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (cho migrations, port 5432)
DIRECT_URL="postgresql://...@pooler.supabase.com:5432/postgres"
```

```
Vercel Functions (nhiều instances)
     ├── Function 1 ──────┐
     ├── Function 2 ──────┤→ PgBouncer → PostgreSQL
     ├── Function 3 ──────┤   (pool ~20 connections)
     └── Function N ──────┘
```

PgBouncer tái sử dụng connections → database không bị quá tải.

---

## 5. Deploy Lên Vercel — Từng Bước

### Bước 1: Push code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/clinic-booking.git
git push -u origin main
```

### Bước 2: Connect Vercel với GitHub
1. Đăng nhập [vercel.com](https://vercel.com)
2. "New Project" → Import từ GitHub
3. Chọn repository `clinic-booking`

### Bước 3: Cấu hình Environment Variables
Trong Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY     = sb_secret_...          # secret key vercel_production
DATABASE_URL                  = postgresql://...:6543/postgres?pgbouncer=true
DIRECT_URL                    = postgresql://...:5432/postgres
NEXT_PUBLIC_APP_URL           = https://cbs.goldhoang.dev
```

Sau khi đổi `NEXT_PUBLIC_*` phải **Redeploy**. `DATABASE_URL` phải là `postgresql://`, không phải `sb_`.

### Bước 4: Deploy
Click "Deploy" → Vercel tự build và deploy.

Sau này, mỗi khi push lên GitHub → Vercel tự động redeploy.

---

## 6. Vercel Preview Deployments

Mỗi Pull Request → Vercel tạo preview URL riêng:
```
main branch → clinic-booking.vercel.app (production)
feature/new-ui → clinic-booking-git-feature-new-ui.vercel.app (preview)
```

---

## 7. Vercel Free Tier Giới Hạn

| Giới hạn | Free | Pro |
|---------|------|-----|
| Bandwidth | 100 GB/tháng | 1 TB |
| Function executions | 100,000/tháng | Unlimited |
| Function timeout | 10 giây | 60 giây |
| Builds | 100/tháng | Unlimited |
| Team members | 1 | Unlimited |

Với dự án nhỏ/học tập, Free tier là đủ.

---

## 8. Sơ Đồ Tổng Thể Deployment

```
Developer
    │
    │ git push origin main
    ▼
GitHub Repository
    │
    │ Webhook trigger
    ▼
Vercel CI/CD Pipeline
    │
    ├── Install dependencies (npm ci)
    ├── prisma generate
    ├── next build
    └── Deploy to Edge Network
         │
         ├── CDN (static files) ──────────► Users worldwide
         │   Vị trí: 40+ locations toàn cầu
         │
         ├── Serverless Functions ────────► AWS Lambda
         │   Vị trí: Closest to user
         │
         └── Database Connection ─────────► Supabase (Singapore/US)
```

---

**Tiếp theo:** [🔑 Biến Môi Trường →](./environment-variables.md)
