// ============================================================
// Supabase Database Operations - Usage Examples
// ============================================================

import { supabase, Course, Student, StudentCourse } from './supabase';

// ============================================================
// 1. COURSES - Read Operations
// ============================================================

// Get all courses
export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return data as Course[];
}

// Get courses by language
export async function getCoursesByLanguage(language: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('language', language)
    .order('level', { ascending: true });

  if (error) throw new Error(`Failed to fetch ${language} courses: ${error.message}`);
  return data as Course[];
}

// Get courses by level
export async function getCoursesByLevel(level: 'beginner' | 'intermediate' | 'advanced') {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('level', level);

  if (error) throw new Error(`Failed to fetch ${level} courses: ${error.message}`);
  return data as Course[];
}

// Get single course with enrollment count
export async function getCourseDetails(courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      student_courses(count)
    `)
    .eq('id', courseId)
    .single();

  if (error) throw new Error(`Failed to fetch course details: ${error.message}`);
  return data;
}

// ============================================================
// 2. COURSES - Write Operations
// ============================================================

// Create new course (admin only)
export async function createCourse(course: {
  name: string;
  description: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  max_students: number;
  duration_weeks: number;
  price: number;
}) {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();

  if (error) throw new Error(`Failed to create course: ${error.message}`);
  return data as Course;
}

// Update course (admin only)
export async function updateCourse(courseId: string, updates: Partial<Course>) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update course: ${error.message}`);
  return data as Course;
}

// Delete course (admin only)
export async function deleteCourse(courseId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw new Error(`Failed to delete course: ${error.message}`);
}

// ============================================================
// 3. STUDENTS - Read Operations
// ============================================================

// Get student profile by user ID
export async function getStudentProfile(userId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch student profile: ${error.message}`);
  return data as Student;
}

// Get student profile by student ID
export async function getStudentById(studentId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) throw new Error(`Failed to fetch student: ${error.message}`);
  return data as Student;
}

// ============================================================
// 4. STUDENTS - Write Operations
// ============================================================

// Create student profile
export async function createStudentProfile(userId: string, phone: string, address: string) {
  const { data, error } = await supabase
    .from('students')
    .insert([
      {
        user_id: userId,
        phone,
        address,
        language_level: 'beginner',
      }
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to create student profile: ${error.message}`);
  return data as Student;
}

// Update student profile
export async function updateStudentProfile(studentId: string, updates: Partial<Student>) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update student profile: ${error.message}`);
  return data as Student;
}

// Update student language level
export async function updateLanguageLevel(studentId: string, level: 'beginner' | 'intermediate' | 'advanced') {
  return updateStudentProfile(studentId, { language_level: level } as any);
}

// ============================================================
// 5. ENROLLMENTS - Read Operations
// ============================================================

// Get all enrollments for a student
export async function getStudentEnrollments(studentId: string) {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      *,
      courses(*)
    `)
    .eq('student_id', studentId)
    .order('enrollment_date', { ascending: false });

  if (error) throw new Error(`Failed to fetch enrollments: ${error.message}`);
  return data;
}

// Get active enrollments for a student
export async function getActiveEnrollments(studentId: string) {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      *,
      courses(*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (error) throw new Error(`Failed to fetch active enrollments: ${error.message}`);
  return data;
}

// Get all students enrolled in a course
export async function getEnrolledStudents(courseId: string) {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      *,
      students(*)
    `)
    .eq('course_id', courseId)
    .eq('status', 'active');

  if (error) throw new Error(`Failed to fetch enrolled students: ${error.message}`);
  return data;
}

// Get enrollment count for a course
export async function getEnrollmentCount(courseId: string) {
  const { count, error } = await supabase
    .from('student_courses')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('status', 'active');

  if (error) throw new Error(`Failed to get enrollment count: ${error.message}`);
  return count || 0;
}

// ============================================================
// 6. ENROLLMENTS - Write Operations
// ============================================================

// Enroll student in a course
export async function enrollStudent(studentId: string, courseId: string) {
  const { data, error } = await supabase
    .from('student_courses')
    .insert([
      {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
      }
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to enroll student: ${error.message}`);
  return data as StudentCourse;
}

// Update enrollment status
export async function updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'completed' | 'dropped') {
  const { data, error } = await supabase
    .from('student_courses')
    .update({ status })
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update enrollment: ${error.message}`);
  return data as StudentCourse;
}

// Drop student from course
export async function dropCourse(enrollmentId: string) {
  return updateEnrollmentStatus(enrollmentId, 'dropped');
}

// Complete course enrollment
export async function completeCourse(enrollmentId: string) {
  return updateEnrollmentStatus(enrollmentId, 'completed');
}

// ============================================================
// 7. ADVANCED QUERIES
// ============================================================

// Get student dashboard (all their courses with details)
export async function getStudentDashboard(studentId: string) {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      id,
      status,
      enrollment_date,
      courses(
        id,
        name,
        language,
        level,
        duration_weeks,
        price
      )
    `)
    .eq('student_id', studentId)
    .order('enrollment_date', { ascending: false });

  if (error) throw new Error(`Failed to fetch dashboard: ${error.message}`);
  return data;
}

// Get course statistics
export async function getCourseStatistics(courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      student_courses(status)
    `)
    .eq('id', courseId)
    .single();

  if (error) throw new Error(`Failed to fetch course statistics: ${error.message}`);

  const enrollments = data.student_courses as any[];
  return {
    course: data,
    totalEnrolled: enrollments.length,
    active: enrollments.filter((e) => e.status === 'active').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
    dropped: enrollments.filter((e) => e.status === 'dropped').length,
  };
}

// Search courses
export async function searchCourses(query: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (error) throw new Error(`Failed to search courses: ${error.message}`);
  return data as Course[];
}

// ============================================================
// 8. ERROR HANDLING HELPER
// ============================================================

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`${operationName} failed:`, message);
    return { success: false, error: message };
  }
}

// Usage: const result = await withErrorHandling(() => getAllCourses(), 'Fetch courses');
