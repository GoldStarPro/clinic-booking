-- Xóa tất cả policies cũ
DROP POLICY IF EXISTS "Users can view their own data" ON "User";
DROP POLICY IF EXISTS "Users can update their own data" ON "User";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "User";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable select for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "User";
DROP POLICY IF EXISTS "Users can view their own appointments" ON "Appointment";
DROP POLICY IF EXISTS "Users can create appointments" ON "Appointment";
DROP POLICY IF EXISTS "Users can update their own appointments" ON "Appointment";
DROP POLICY IF EXISTS "Enable read access for all users" ON "User";
DROP POLICY IF EXISTS "Enable update for admin only" ON "User";
DROP POLICY IF EXISTS "Admin can view all appointments" ON "Appointment";
DROP POLICY IF EXISTS "Admin can manage all users" ON "User";
DROP POLICY IF EXISTS "Admin can view patient info in appointments" ON "User";
DROP POLICY IF EXISTS "Doctors can view their appointments" ON "Appointment";
DROP POLICY IF EXISTS "Doctors can update appointment status" ON "Appointment";
DROP POLICY IF EXISTS "Admin can view all patients" ON "User";
DROP POLICY IF EXISTS "Admin can view all users" ON "User";
DROP POLICY IF EXISTS "Users can manage their own data" ON "User";
DROP POLICY IF EXISTS "Service role can do everything" ON "User";
DROP POLICY IF EXISTS "Service role can do everything" ON "Appointment";

-- Cấp quyền truy cập (không grant toàn bộ tables trong schema — tránh lộ bảng nội bộ Prisma)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."User" TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Appointment" TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- NOTE: Policies bên dưới đã được thay thế bởi
-- supabase/migrations/20260808000000_security_hardening.sql
-- Hãy chạy file hardening đó SAU migration này (SQL Editor hoặc supabase db push).

-- Bật Row Level Security cho tất cả các bảng
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

-- Policies cho bảng User
-- Cho phép service_role thực hiện tất cả các thao tác
CREATE POLICY "Service role can do everything" 
ON "User" 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Cho phép tất cả người dùng tạo user mới (đăng ký)
CREATE POLICY "Enable insert for all users" 
ON "User" 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Cho phép mọi người xem thông tin bác sĩ
CREATE POLICY "Enable read access for all users" 
ON "User" 
FOR SELECT 
TO anon, authenticated
USING (role = 'DOCTOR'::"Role");

-- Cho phép admin quản lý tất cả users
CREATE POLICY "Admin can manage all users" 
ON "User" 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Cho phép user quản lý dữ liệu của chính mình
CREATE POLICY "Users can manage their own data" 
ON "User" 
FOR ALL 
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Policies cho bảng Appointment
-- Cho phép service_role thực hiện tất cả các thao tác
CREATE POLICY "Service role can do everything" 
ON "Appointment" 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Cho phép admin xem tất cả appointments
CREATE POLICY "Admin can view all appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING (true);

-- Cho phép doctor cập nhật trạng thái appointments
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

-- Cho phép doctor xem appointments của mình
CREATE POLICY "Doctors can view their appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING (
  "doctorId" = auth.uid()::text 
  AND (auth.jwt() ->> 'role'::text) = 'DOCTOR'::text
);

-- Cho phép user tạo lịch hẹn mới
CREATE POLICY "Users can create appointments" 
ON "Appointment" 
FOR INSERT 
TO authenticated
WITH CHECK ("patientId" = auth.uid()::text);

-- Cho phép user cập nhật lịch hẹn của mình
CREATE POLICY "Users can update their own appointments" 
ON "Appointment" 
FOR UPDATE 
TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text);

-- Cho phép user xem lịch hẹn của mình
CREATE POLICY "Users can view their own appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING ("patientId" = auth.uid()::text OR "doctorId" = auth.uid()::text); 