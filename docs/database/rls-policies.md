# 🔒 Row Level Security (RLS) Policies

> **Canonical SQL (chạy 1 file):** [`supabase/migrations/20260808120000_rls_canonical.sql`](../../supabase/migrations/20260808120000_rls_canonical.sql)  
> File cũ nằm trong [`supabase/archive/`](../../supabase/archive/) — **không dùng khi setup mới**.

---

## 1. RLS Là Gì?

Không có RLS: mọi user có thể đọc hết bảng `Appointment`.  
Có RLS: Postgres tự lọc row theo policy (ví dụ chỉ thấy lịch của mình).

**RLS = bảo vệ ở tầng database**, không phụ thuộc code API có bug hay không.

---

## 2. Khái Niệm Quan Trọng

### Init Plan — bọc `auth.uid()`
```sql
-- ❌ Chậm / bị Advisor cảnh báo
id = auth.uid()::text

-- ✅
id = (select auth.uid())::text
-- hoặc
id = private.current_uid()
```

### Schema `private` cho helper
| Function | Mục đích |
|----------|----------|
| `private.current_uid()` | UID hiện tại (có `SET search_path`) |
| `private.is_admin()` | `SECURITY DEFINER` — đọc role ADMIN (tránh recursion RLS) |
| `private.is_doctor()` | Tương tự cho DOCTOR |

Helper **không** đặt trong `public` → không lộ `/rest/v1/rpc/is_admin`.

### Roles
| Role | Dùng khi |
|------|----------|
| `anon` | Chưa login (xem bác sĩ, đăng ký) |
| `authenticated` | Đã login |
| `service_role` | Server / bypass RLS (service key) |

---

## 3. Policies Hiện Tại

**Một policy / action / bảng** → hết *Multiple Permissive Policies*.  
**Không** `USING (true)` cho `anon`/`authenticated` → hết *Always True*.

### `User`
| Policy | Ai được |
|--------|---------|
| `user_select` | Directory DOCTOR **hoặc** own row **hoặc** admin |
| `user_insert` | Đăng ký PATIENT **hoặc** admin |
| `user_update` / `user_delete` | Own **hoặc** admin |
| `user_service_role` | `service_role` |

**Grants:** `anon` chỉ `SELECT, INSERT`. Không `UPDATE/DELETE` cho anon.

### `Appointment`
| Policy | Ai được |
|--------|---------|
| `appointment_select` | Admin / patient / doctor của lịch |
| `appointment_insert` | Admin hoặc `patientId = current user` |
| `appointment_update` | Admin / patient / doctor phụ trách |
| `appointment_delete` | Admin hoặc patient |
| `appointment_service_role` | `service_role` |

**Grants:** **không** cấp gì cho `anon`.

### `_prisma_migrations`
REVOKE khỏi `anon`/`authenticated` + bật RLS + chỉ `service_role`.

### GraphQL
Canonical SQL chạy `DROP EXTENSION IF EXISTS pg_graphql` — app chỉ dùng **supabase-js (REST)**.

---

## 4. Setup Máy Mới

```text
1. npx prisma migrate deploy   # hoặc db push — tạo bảng
2. SQL Editor → chạy 20260808120000_rls_canonical.sql
3. npx prisma db seed
4. npm run security-check
```

### Auth Dashboard
| Setting | Free tier |
|---------|-----------|
| Minimum password length ≥ 8 | ✅ Bật |
| Leaked password protection | ❌ Cần **Pro Plan** — bỏ qua trên Free |

---

## 5. Vì Sao Lỗi Từng Tái Phát?

1. Chạy lại SQL cũ có `GRANT ALL ON ALL TABLES`
2. Helper `SECURITY DEFINER` nằm ở `public` → RPC lộ
3. Policy admin `USING (true)`
4. CVE dependency mới (Dependabot) — bình thường

**Chống tái phát:** chỉ chạy file canonical; CI `npm run security-lint:sql`; Dependabot.

---

**Tiếp theo:** [🔄 Supabase vs Prisma →](./supabase-and-prisma.md)
