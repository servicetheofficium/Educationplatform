-- =============================================================
-- KNC Education Platform — Database Setup
-- Run once to create all tables, indexes, triggers, and RLS policies.
-- Requires Supabase project with auth enabled.
-- =============================================================

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  user_type VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (user_type IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  phone VARCHAR(20),
  address TEXT,
  language_level VARCHAR(50) DEFAULT 'beginner' CHECK (language_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  max_students INTEGER NOT NULL DEFAULT 30,
  duration_weeks INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_status ON student_courses(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles can view own" ON profiles;
DROP POLICY IF EXISTS "Profiles can update own" ON profiles;

DROP POLICY IF EXISTS "Students can view their own profile" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;
DROP POLICY IF EXISTS "Students can view their enrollments" ON student_courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Anyone can create applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- students
CREATE POLICY "Students can view their own profile"
  ON students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile"
  ON students FOR UPDATE
  USING (auth.uid() = user_id);

-- courses (public read)
CREATE POLICY "Courses are viewable by everyone"
  ON courses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

-- student_courses
CREATE POLICY "Students can view their enrollments"
  ON student_courses FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- applications
CREATE POLICY "Anyone can create applications"
  ON applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can delete applications"
  ON applications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

-- ─── GRANTS ──────────────────────────────────────────────────

GRANT SELECT ON courses TO anon;
GRANT SELECT, INSERT ON applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON students TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_courses TO authenticated;
