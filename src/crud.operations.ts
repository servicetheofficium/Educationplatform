import { supabase } from './supabase';

// ============ APPLICATIONS CRUD ============

// Create application
export async function createApplication(data: {
  name: string;
  email: string;
  phone?: string;
  course_id?: string;
  message: string;
}) {
  try {
    const { data: result, error } = await supabase
      .from('applications')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create application',
    };
  }
}

// Get all applications (admin only)
export async function getApplications() {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, courses(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching applications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch applications',
    };
  }
}

// Get single application
export async function getApplication(id: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, courses(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch application',
    };
  }
}

// Update application
export async function updateApplication(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    course_id: string;
    message: string;
    status: 'pending' | 'approved' | 'rejected' | 'contacted';
  }>
) {
  try {
    const { data: result, error } = await supabase
      .from('applications')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update application',
    };
  }
}

// Delete application
export async function deleteApplication(id: string) {
  try {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete application',
    };
  }
}

// ============ COURSES CRUD ============

// Create course
export async function createCourse(data: {
  name: string;
  description: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  max_students: number;
  duration_weeks: number;
  price: number;
}) {
  try {
    const { data: result, error } = await supabase
      .from('courses')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course',
    };
  }
}

// Get all courses
export async function getCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch courses',
    };
  }
}

// Get single course
export async function getCourse(id: string) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch course',
    };
  }
}

// Update course
export async function updateCourse(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    language: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    max_students: number;
    duration_weeks: number;
    price: number;
  }>
) {
  try {
    const { data: result, error } = await supabase
      .from('courses')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course',
    };
  }
}

// Delete course
export async function deleteCourse(id: string) {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course',
    };
  }
}

// ============ STUDENTS CRUD ============

// Get all students (admin only)
export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, users(email, full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching students:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch students',
    };
  }
}

// Get single student
export async function getStudent(id: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, users(email, full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student',
    };
  }
}

// Update student
export async function updateStudent(
  id: string,
  data: Partial<{
    phone: string;
    address: string;
    language_level: 'beginner' | 'intermediate' | 'advanced';
  }>
) {
  try {
    const { data: result, error } = await supabase
      .from('students')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update student',
    };
  }
}

// Delete student
export async function deleteStudent(id: string) {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete student',
    };
  }
}

// ============ ENROLLMENTS CRUD ============

// Get all enrollments
export async function getEnrollments() {
  try {
    const { data, error } = await supabase
      .from('student_courses')
      .select('*, students(users(full_name)), courses(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch enrollments',
    };
  }
}

// Create enrollment
export async function createEnrollment(data: {
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
}) {
  try {
    const { data: result, error } = await supabase
      .from('student_courses')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create enrollment',
    };
  }
}

// Update enrollment status
export async function updateEnrollment(
  id: string,
  status: 'active' | 'completed' | 'dropped'
) {
  try {
    const { data, error } = await supabase
      .from('student_courses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update enrollment',
    };
  }
}

// Delete enrollment
export async function deleteEnrollment(id: string) {
  try {
    const { error } = await supabase
      .from('student_courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete enrollment',
    };
  }
}
