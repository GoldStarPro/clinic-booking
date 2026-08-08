-- =============================================================================
-- Clinic Booking — CANONICAL RLS SETUP (chạy 1 file này là đủ)
-- Sau: Prisma migrate/db push → dán file này vào Supabase SQL Editor → Run
--
-- Bao gồm:
--   • Schema private cho helper (không lộ /rest/v1/rpc)
--   • RLS User / Appointment (1 policy / action)
--   • Khoá _prisma_migrations
--   • Tắt pg_graphql nếu có (app không dùng GraphQL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Tắt GraphQL API surface (hết cảnh báo GraphQL Schema exposure)
-- -----------------------------------------------------------------------------
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- -----------------------------------------------------------------------------
-- 1) Schema private — helper không expose qua PostgREST
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, anon, authenticated, service_role;

-- Xoá bản public cũ (nếu đã chạy hardening trước đó)
DROP FUNCTION IF EXISTS public.current_uid() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_doctor() CASCADE;

CREATE OR REPLACE FUNCTION private.current_uid()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT (SELECT auth.uid())::text;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User"
    WHERE id = (SELECT auth.uid())::text
      AND role = 'ADMIN'::"Role"
  );
$$;

CREATE OR REPLACE FUNCTION private.is_doctor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User"
    WHERE id = (SELECT auth.uid())::text
      AND role = 'DOCTOR'::"Role"
  );
$$;

REVOKE ALL ON FUNCTION private.current_uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_doctor() FROM PUBLIC;

-- Chỉ role cần thiết (dùng trong RLS) — không còn endpoint RPC public
GRANT EXECUTE ON FUNCTION private.current_uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_doctor() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2) Khoá bảng nội bộ Prisma
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    REVOKE ALL ON TABLE public._prisma_migrations FROM PUBLIC, anon, authenticated;
    GRANT ALL ON TABLE public._prisma_migrations TO postgres, service_role;

    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role prisma migrations" ON public._prisma_migrations;
    CREATE POLICY "Service role prisma migrations"
      ON public._prisma_migrations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3) Drop mọi policy cũ trên User / Appointment
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'Appointment')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4) Grants hẹp (đúng nhu cầu app)
--    User: anon cần SELECT (danh sách bác sĩ) + INSERT (đăng ký)
--    Appointment: chỉ authenticated (+ service_role)
-- -----------------------------------------------------------------------------
REVOKE ALL ON TABLE public."User" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public."Appointment" FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT ON TABLE public."User" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."User" TO authenticated;
GRANT ALL ON TABLE public."User" TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Appointment" TO authenticated;
GRANT ALL ON TABLE public."Appointment" TO service_role;

-- -----------------------------------------------------------------------------
-- 5) Policies — User
-- -----------------------------------------------------------------------------
CREATE POLICY "user_select"
ON public."User"
FOR SELECT
TO anon, authenticated
USING (
  role = 'DOCTOR'::"Role"
  OR id = private.current_uid()
  OR private.is_admin()
);

CREATE POLICY "user_insert"
ON public."User"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  private.is_admin()
  OR (
    role = 'PATIENT'::"Role"
    AND (
      id = private.current_uid()
      OR (SELECT auth.uid()) IS NULL
    )
  )
);

CREATE POLICY "user_update"
ON public."User"
FOR UPDATE
TO authenticated
USING (
  id = private.current_uid()
  OR private.is_admin()
)
WITH CHECK (
  id = private.current_uid()
  OR private.is_admin()
);

CREATE POLICY "user_delete"
ON public."User"
FOR DELETE
TO authenticated
USING (
  id = private.current_uid()
  OR private.is_admin()
);

CREATE POLICY "user_service_role"
ON public."User"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6) Policies — Appointment
-- -----------------------------------------------------------------------------
CREATE POLICY "appointment_select"
ON public."Appointment"
FOR SELECT
TO authenticated
USING (
  private.is_admin()
  OR "patientId" = private.current_uid()
  OR "doctorId" = private.current_uid()
);

CREATE POLICY "appointment_insert"
ON public."Appointment"
FOR INSERT
TO authenticated
WITH CHECK (
  private.is_admin()
  OR "patientId" = private.current_uid()
);

CREATE POLICY "appointment_update"
ON public."Appointment"
FOR UPDATE
TO authenticated
USING (
  private.is_admin()
  OR "patientId" = private.current_uid()
  OR ("doctorId" = private.current_uid() AND private.is_doctor())
)
WITH CHECK (
  private.is_admin()
  OR "patientId" = private.current_uid()
  OR ("doctorId" = private.current_uid() AND private.is_doctor())
);

CREATE POLICY "appointment_delete"
ON public."Appointment"
FOR DELETE
TO authenticated
USING (
  private.is_admin()
  OR "patientId" = private.current_uid()
);

CREATE POLICY "appointment_service_role"
ON public."Appointment"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Auth dashboard (không làm được bằng SQL):
--   • Minimum password length ≥ 8  → đã làm
--   • Leaked password protection   → chỉ có trên Pro Plan (Free: bỏ qua)
-- =============================================================================
