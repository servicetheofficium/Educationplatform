-- =============================================================
-- KNC Education Platform — Database Reset
-- ⚠️  DESTRUCTIVE — drops all tables and data.
-- For development only. Run setup.sql + seed.sql after this.
-- =============================================================

-- Drop trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS student_courses CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Confirm
SELECT 'Database reset complete. Run setup.sql then seed.sql.' AS status;
