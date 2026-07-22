-- Applied to live project 2026-07-22 via performance audit.
CREATE INDEX IF NOT EXISTS idx_applications_course_id ON public.applications(course_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON public.service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_student_id ON public.service_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_students_cancelled_at ON public.students(cancelled_at);
