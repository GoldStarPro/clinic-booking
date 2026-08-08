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
DROP POLICY IF EXISTS "Enable read access for all users" ON "Doctor";
DROP POLICY IF EXISTS "Enable update for admin only" ON "Doctor";

-- Cấp quyền truy cập
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Bật Row Level Security cho tất cả các bảng
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Doctor" ENABLE ROW LEVEL SECURITY;

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

-- Cho phép user xem thông tin của chính mình
CREATE POLICY "Users can view their own data" 
ON "User" 
FOR SELECT 
TO authenticated
USING (id = auth.uid()::text);

-- Cho phép user cập nhật thông tin của chính mình
CREATE POLICY "Users can update their own data" 
ON "User" 
FOR UPDATE 
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Cho phép user xóa tài khoản của chính mình
CREATE POLICY "Users can delete their own data" 
ON "User" 
FOR DELETE 
TO authenticated
USING (id = auth.uid()::text);

-- Policies cho bảng Appointment
-- Cho phép service_role thực hiện tất cả các thao tác
CREATE POLICY "Service role can do everything" 
ON "Appointment" 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Cho phép user xem lịch hẹn của mình
CREATE POLICY "Users can view their own appointments" 
ON "Appointment" 
FOR SELECT 
TO authenticated
USING ("patientId" = auth.uid()::text);

-- Cho phép user tạo lịch hẹn mới
CREATE POLICY "Users can create appointments" 
ON "Appointment" 
FOR INSERT 
TO authenticated
WITH CHECK ("patientId" = auth.uid()::text);

-- Cho phép user cập nhật/cancel lịch hẹn của mình
CREATE POLICY "Users can update their own appointments" 
ON "Appointment" 
FOR UPDATE 
TO authenticated
USING ("patientId" = auth.uid()::text);

-- Policies cho bảng Doctor
-- Cho phép service_role thực hiện tất cả các thao tác
CREATE POLICY "Service role can do everything" 
ON "Doctor" 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Cho phép mọi người xem thông tin bác sĩ
CREATE POLICY "Enable read access for all users" 
ON "Doctor" 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Cho phép admin cập nhật thông tin bác sĩ
CREATE POLICY "Enable update for admin only" 
ON "Doctor" 
FOR UPDATE 
TO authenticated
USING (auth.role() = 'admin'::text); 