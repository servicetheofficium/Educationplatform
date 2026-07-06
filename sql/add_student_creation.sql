-- Allow real student records to be created directly from approved applications,
-- without requiring the student to have a login account (profiles/auth.users row).
--
-- Root cause this fixes: `students` and `student_courses` were never populated because
-- (1) no code path ever inserted into `students` — the admin UI just displayed
--     "approved" applications as pseudo-student rows, and
-- (2) even if code tried to insert, RLS had no INSERT policy on `students` or
--     `student_courses` at all, so every insert would be silently denied.

-- ─── SCHEMA ──────────────────────────────────────────────────

ALTER TABLE students ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_application_id
  ON students(application_id) WHERE application_id IS NOT NULL;

-- ─── RLS: admins were missing INSERT rights on students/student_courses ──────

DROP POLICY IF EXISTS "Admins can create students" ON students;
CREATE POLICY "Admins can create students"
  ON students FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

DROP POLICY IF EXISTS "Admins can create enrollments" ON student_courses;
CREATE POLICY "Admins can create enrollments"
  ON student_courses FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update enrollments" ON student_courses;
CREATE POLICY "Admins can update enrollments"
  ON student_courses FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete enrollments" ON student_courses;
CREATE POLICY "Admins can delete enrollments"
  ON student_courses FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

-- ─── BACKFILL existing approved applications into real student rows ─────────

INSERT INTO students (
  application_id, name, email, phone, nationality, passport_number,
  visa_status, duration_months, visa_change_date, visa_last_date,
  school_student_id, doc_status, enrollment_date
)
SELECT
  a.id, a.name, a.email, a.phone, a.nationality, a.passport_number,
  a.visa_status, a.duration_months, a.visa_change_date, a.visa_last_date,
  a.school_student_id, a.doc_status, a.created_at::date
FROM applications a
WHERE a.status = 'approved'
ON CONFLICT (application_id) WHERE application_id IS NOT NULL DO NOTHING;

INSERT INTO student_courses (student_id, course_id, status)
SELECT s.id, a.course_id, 'active'
FROM students s
JOIN applications a ON a.id = s.application_id
WHERE a.course_id IS NOT NULL
ON CONFLICT (student_id, course_id) DO NOTHING;
