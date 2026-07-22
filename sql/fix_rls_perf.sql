-- Fixes Supabase performance-advisor warnings:
--   Auth RLS Initialization Plan (34): wrap auth.uid()/is_admin() in (select ...)
--     so Postgres evaluates it once per statement, not once per row.
--   Multiple Permissive Policies (30): merge overlapping policies on profiles,
--     students, student_courses, courses into one policy per action.
-- No change in who can access what -- same effective permissions, cheaper to evaluate.

-- ============ helper function ============
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND user_type = 'admin'
  );
$function$;

-- ============ profiles ============
-- "Users can view own profile" is a strict subset of "Admins can view all
-- profiles" (which already includes auth.uid() = id) -- drop the redundant one.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING ((select public.is_admin()) OR ((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- ============ students ============
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view own or admins view all" ON public.students
  FOR SELECT USING (
    (select public.is_admin()) OR (user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update students" ON public.students;
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update own or admins update all" ON public.students
  FOR UPDATE USING (
    (select public.is_admin()) OR (user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can create students" ON public.students;
CREATE POLICY "Admins can create students" ON public.students
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete students" ON public.students;
CREATE POLICY "Admins can delete students" ON public.students
  FOR DELETE USING ((select public.is_admin()));

-- ============ student_courses ============
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.student_courses;
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.student_courses;
CREATE POLICY "Students view own or admins view all enrollments" ON public.student_courses
  FOR SELECT USING (
    (select public.is_admin())
    OR student_id IN (SELECT id FROM public.students WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can create enrollments" ON public.student_courses;
CREATE POLICY "Admins can create enrollments" ON public.student_courses
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can update enrollments" ON public.student_courses;
CREATE POLICY "Admins can update enrollments" ON public.student_courses
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete enrollments" ON public.student_courses;
CREATE POLICY "Admins can delete enrollments" ON public.student_courses
  FOR DELETE USING ((select public.is_admin()));

-- ============ courses ============
-- "Admins can manage courses" (FOR ALL) overlapped with the public SELECT
-- policy on every read. Split into write-only actions so SELECT has a
-- single applicable policy.
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can insert courses" ON public.courses
  FOR INSERT WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update courses" ON public.courses
  FOR UPDATE USING ((select public.is_admin()));
CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE USING ((select public.is_admin()));
-- "Courses are viewable by everyone" (SELECT USING true) is untouched.

-- ============ agents ============
DROP POLICY IF EXISTS "Admins can view all agents" ON public.agents;
CREATE POLICY "Admins can view all agents" ON public.agents
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can create agents" ON public.agents;
CREATE POLICY "Admins can create agents" ON public.agents
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can update agents" ON public.agents;
CREATE POLICY "Admins can update agents" ON public.agents
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete agents" ON public.agents;
CREATE POLICY "Admins can delete agents" ON public.agents
  FOR DELETE USING ((select public.is_admin()));

-- ============ applications ============
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
CREATE POLICY "Admins can delete applications" ON public.applications
  FOR DELETE USING ((select public.is_admin()));
-- "Anyone can create applications" (INSERT WITH CHECK true) is untouched.

-- ============ document_services ============
DROP POLICY IF EXISTS "document_services_insert_admin" ON public.document_services;
CREATE POLICY "document_services_insert_admin" ON public.document_services
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "document_services_update_admin" ON public.document_services;
CREATE POLICY "document_services_update_admin" ON public.document_services
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "document_services_delete_admin" ON public.document_services;
CREATE POLICY "document_services_delete_admin" ON public.document_services
  FOR DELETE USING ((select public.is_admin()));
-- "document_services_select_public" (SELECT USING true) is untouched.

-- ============ service_requests ============
DROP POLICY IF EXISTS "service_requests_select_admin" ON public.service_requests;
CREATE POLICY "service_requests_select_admin" ON public.service_requests
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "service_requests_update_admin" ON public.service_requests;
CREATE POLICY "service_requests_update_admin" ON public.service_requests
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "service_requests_delete_admin" ON public.service_requests;
CREATE POLICY "service_requests_delete_admin" ON public.service_requests
  FOR DELETE USING ((select public.is_admin()));
-- "service_requests_insert_public" (INSERT WITH CHECK true) is untouched.

-- ============ student_document_cases ============
DROP POLICY IF EXISTS "Admins can view all document cases" ON public.student_document_cases;
CREATE POLICY "Admins can view all document cases" ON public.student_document_cases
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can create document cases" ON public.student_document_cases;
CREATE POLICY "Admins can create document cases" ON public.student_document_cases
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can update document cases" ON public.student_document_cases;
CREATE POLICY "Admins can update document cases" ON public.student_document_cases
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete document cases" ON public.student_document_cases;
CREATE POLICY "Admins can delete document cases" ON public.student_document_cases
  FOR DELETE USING ((select public.is_admin()));

-- ============ admin_activity_log ============
DROP POLICY IF EXISTS "Admins can view activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log
  FOR INSERT WITH CHECK ((select public.is_admin()));
