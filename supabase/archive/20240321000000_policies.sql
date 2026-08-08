-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON "public"."User";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."User";
DROP POLICY IF EXISTS "Enable select for authenticated users" ON "public"."User";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."User";
DROP POLICY IF EXISTS "Users can view their own data" ON "User";
DROP POLICY IF EXISTS "Users can update their own data" ON "User";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "User";
DROP POLICY IF EXISTS "Users can view their own appointments" ON "Appointment";
DROP POLICY IF EXISTS "Users can create appointments" ON "Appointment";
DROP POLICY IF EXISTS "Users can update their own appointments" ON "Appointment";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Doctor";
DROP POLICY IF EXISTS "Enable update for admin only" ON "Doctor";

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Enable RLS for all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Doctor" ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY "Enable insert for authenticated users"
ON "public"."User"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON "public"."User"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users"
ON "public"."User"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Enable delete for authenticated users"
ON "public"."User"
FOR DELETE
TO authenticated
USING (auth.uid()::text = id::text);

-- Appointment table policies
CREATE POLICY "Users can view their own appointments" 
ON "Appointment" FOR SELECT 
USING ("patientId" = auth.uid()::text);

CREATE POLICY "Users can create appointments" 
ON "Appointment" FOR INSERT 
WITH CHECK ("patientId" = auth.uid()::text);

CREATE POLICY "Users can update their own appointments" 
ON "Appointment" FOR UPDATE 
USING ("patientId" = auth.uid()::text);

-- Doctor table policies
CREATE POLICY "Enable read access for all users" 
ON "Doctor" FOR SELECT 
USING (true);

CREATE POLICY "Enable update for admin only" 
ON "Doctor" FOR UPDATE 
USING (auth.role() = 'admin'); 