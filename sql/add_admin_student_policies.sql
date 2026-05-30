-- Allow admins to read, update, and delete any student record

DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update students" ON students;
CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete students" ON students;
CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );
