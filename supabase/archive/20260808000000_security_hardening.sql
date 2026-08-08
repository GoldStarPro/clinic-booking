-- =============================================================================
-- Security hardening migration (Supabase Security Advisor + RLS performance)
-- Fixes:
--   1. RLS Disabled / GraphQL exposure on public._prisma_migrations
--   2. RLS Policy Always True (Admin policies using USING (true))
--   3. Multiple Permissive Policies (consolidate per role + action)
--   4. Auth RLS Initialization Plan (wrap auth.* in (select ...))
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER avoids RLS recursion on "User")
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_uid()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (SELECT auth.uid())::text;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User"
    WHERE id = (SELECT auth.uid())::text
      AND role = 'ADMIN'::"Role"
  );
$$;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User"
    WHERE id = (SELECT auth.uid())::text
      AND role = 'DOCTOR'::"Role"
  );
$$;

REVOKE ALL ON FUNCTION public.current_uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_doctor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_doctor() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Lock down Prisma migrations table (internal only)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    -- Hide from PostgREST / GraphQL (anon + authenticated)
    REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;
    -- Keep for privileged DB roles used by Prisma / migrations
    GRANT ALL ON TABLE public._prisma_migrations TO postgres, service_role;

    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
    -- No policies for anon/authenticated → deny by default when RLS is on
    DROP POLICY IF EXISTS "Service role prisma migrations" ON public._prisma_migrations;
    CREATE POLICY "Service role prisma migrations"
      ON public._prisma_migrations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Prevent future GRANT ALL ON ALL TABLES from silently re-exposing it:
-- re-assert revoke after any broad grants in older migrations.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- Drop ALL existing User / Appointment policies (old + new names)
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

-- Ensure RLS is enabled
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY;

-- Narrow table grants: app needs these; never blanket-grant every public table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."User" TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Appointment" TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- User policies (ONE policy per action for authenticated / anon)
-- -----------------------------------------------------------------------------

-- SELECT: public doctor directory OR own row OR admin
CREATE POLICY "user_select"
ON public."User"
FOR SELECT
TO anon, authenticated
USING (
  role = 'DOCTOR'::"Role"
  OR id = public.current_uid()
  OR public.is_admin()
);

-- INSERT: registration (own row as PATIENT) OR admin creating users.
-- anon path: only PATIENT rows (covers email-confirm edge cases without session).
CREATE POLICY "user_insert"
ON public."User"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.is_admin()
  OR (
    role = 'PATIENT'::"Role"
    AND (
      id = public.current_uid()
      OR (SELECT auth.uid()) IS NULL
    )
  )
);

-- UPDATE: own profile OR admin
CREATE POLICY "user_update"
ON public."User"
FOR UPDATE
TO authenticated
USING (
  id = public.current_uid()
  OR public.is_admin()
)
WITH CHECK (
  id = public.current_uid()
  OR public.is_admin()
);

-- DELETE: own row OR admin
CREATE POLICY "user_delete"
ON public."User"
FOR DELETE
TO authenticated
USING (
  id = public.current_uid()
  OR public.is_admin()
);

-- service_role bypass (server / Prisma-adjacent privileged paths)
CREATE POLICY "user_service_role"
ON public."User"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Appointment policies (ONE policy per action)
-- -----------------------------------------------------------------------------

CREATE POLICY "appointment_select"
ON public."Appointment"
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR "patientId" = public.current_uid()
  OR "doctorId" = public.current_uid()
);

CREATE POLICY "appointment_insert"
ON public."Appointment"
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR "patientId" = public.current_uid()
);

CREATE POLICY "appointment_update"
ON public."Appointment"
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR "patientId" = public.current_uid()
  OR ("doctorId" = public.current_uid() AND public.is_doctor())
)
WITH CHECK (
  public.is_admin()
  OR "patientId" = public.current_uid()
  OR ("doctorId" = public.current_uid() AND public.is_doctor())
);

CREATE POLICY "appointment_delete"
ON public."Appointment"
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR "patientId" = public.current_uid()
);

CREATE POLICY "appointment_service_role"
ON public."Appointment"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Note: "Leaked Password Protection" is a Supabase Auth dashboard toggle
-- (Authentication → Providers → Email → Leaked password protection).
-- It cannot be enabled via SQL migrations.
-- =============================================================================
