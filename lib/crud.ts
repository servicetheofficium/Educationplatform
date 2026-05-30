"use server";

import { createClient } from "@/utils/supabase/server";
import { sendAdminApplicationNotification } from "@/lib/email";

// ============ APPLICATIONS ============

export async function createApplication(data: {
  name: string;
  email: string;
  phone?: string;
  course_id?: string;
  message: string;
}) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("applications").insert([data]);

    if (error) throw error;

    // Send admin notification (non-blocking — don't fail the submission if email fails)
    sendAdminApplicationNotification({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    }).catch((err) => console.error("Admin email notification failed:", err));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create application",
    };
  }
}

export async function getApplications() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("*, courses(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch applications",
    };
  }
}

export async function updateApplication(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    course_id: string;
    message: string;
    status: "pending" | "approved" | "rejected" | "contacted" | "cancelled";
    nationality: string;
    passport_number: string;
    visa_status: "processing" | "visa_changed" | "first_extension" | "second_extension" | "third_extension";
    duration_months: number;
    visa_change_date: string;
    visa_last_date: string;
  }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("applications")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update application",
    };
  }
}

export async function deleteApplication(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete application",
    };
  }
}

// ============ COURSES ============

export async function getCourses() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch courses",
    };
  }
}

export async function createCourse(data: {
  name: string;
  description: string;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  max_students: number;
  duration_weeks: number;
  price: number;
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("courses")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create course",
    };
  }
}

export async function updateCourse(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    language: string;
    level: "beginner" | "intermediate" | "advanced";
    max_students: number;
    duration_weeks: number;
    price: number;
  }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("courses")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update course",
    };
  }
}

export async function deleteCourse(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete course",
    };
  }
}

// ============ STUDENTS ============

export async function getStudents() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
}

export async function updateStudent(
  id: string,
  data: Partial<{
    phone: string;
    address: string;
    language_level: "beginner" | "intermediate" | "advanced";
    nationality: string;
    passport_number: string;
    visa_status: "processing" | "visa_changed" | "first_extension" | "second_extension" | "third_extension";
    duration_months: number;
    visa_change_date: string;
    visa_last_date: string;
  }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("students")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update student",
    };
  }
}

export async function deleteStudent(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete student",
    };
  }
}

// ============ ENROLLMENTS ============

export async function getEnrollments() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("student_courses")
      .select("*, students(profiles(full_name)), courses(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch enrollments",
    };
  }
}

export async function createEnrollment(data: {
  student_id: string;
  course_id: string;
  status: "active" | "completed" | "dropped";
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("student_courses")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create enrollment",
    };
  }
}

export async function updateEnrollment(
  id: string,
  status: "active" | "completed" | "dropped"
) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("student_courses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update enrollment",
    };
  }
}

export async function deleteEnrollment(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("student_courses")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete enrollment",
    };
  }
}
