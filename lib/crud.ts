"use server";

import { after } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendAdminApplicationNotification, sendAdminServiceRequestNotification, sendAdminStudentAddedNotification } from "@/lib/email";

// ============ ACTIVITY LOG ============

function logAdminActivity(
  action: "create" | "update" | "delete",
  target_table: string,
  target_id: string | null,
  details?: Record<string, unknown> | null
) {
  after(async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      await supabase.from("admin_activity_log").insert([{
        admin_id: user.id,
        admin_name: profile?.full_name ?? null,
        action,
        target_table,
        target_id,
        details: details ?? null,
      }]);
    } catch (err) {
      console.error("[audit] Failed to log admin activity:", err);
    }
  });
}

export async function getAdminActivityLog() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch activity log",
    };
  }
}

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
    const { data: inserted, error } = await supabase.from("applications").insert([data]).select("id").single();

    if (error) throw error;

    logAdminActivity("create", "applications", inserted?.id ?? null, data);

    after(async () => {
      try {
        await sendAdminApplicationNotification({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
        });
        console.log("[email] Application notification sent");
      } catch (emailErr) {
        console.error("[email] Application notification FAILED:", emailErr);
      }
    });

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
      .select("*, courses(name, language)")
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

// Approving an application should produce a real `students` row (and enrollment),
// not just a status flag — otherwise `students`/`student_courses` stay empty forever.
// Applicants never have a login account, so this is keyed off `application_id`
// instead of `user_id`, and is idempotent (safe to call again on re-approval).
async function ensureStudentFromApplication(app: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  course_id: string | null;
  nationality: string | null;
  passport_number: string | null;
  visa_status: string | null;
  duration_months: string | null;
  visa_change_date: string | null;
  visa_last_date: string | null;
  school_student_id: string | null;
  doc_status: string | null;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("application_id", app.id)
    .maybeSingle();

  let studentId: string = existing?.id;

  if (!studentId) {
    const { data: student, error } = await supabase
      .from("students")
      .insert([{
        application_id: app.id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        nationality: app.nationality,
        passport_number: app.passport_number,
        visa_status: app.visa_status,
        duration_months: app.duration_months,
        visa_change_date: app.visa_change_date,
        visa_last_date: app.visa_last_date,
        school_student_id: app.school_student_id,
        doc_status: app.doc_status,
      }])
      .select("id")
      .single();
    if (error) throw error;
    studentId = student.id;
    logAdminActivity("create", "students", studentId, { application_id: app.id });
  }

  if (app.course_id) {
    const { data: existingEnrollment } = await supabase
      .from("student_courses")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", app.course_id)
      .maybeSingle();

    if (!existingEnrollment) {
      const { error: enrollError } = await supabase
        .from("student_courses")
        .insert([{ student_id: studentId, course_id: app.course_id, status: "active" }]);
      if (enrollError) throw enrollError;
      logAdminActivity("create", "student_courses", studentId, { course_id: app.course_id });
    }
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
    visa_status: "processing" | "visa_changed" | "first_extension" | "second_extension" | "third_extension" | "fourth_extension" | "fifth_extension";
    duration_months: string;
    visa_change_date: string;
    visa_last_date: string;
    school_student_id: string;
    doc_status: "pending" | "submitted" | "checked" | "completed";
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
    logAdminActivity("update", "applications", id, data);

    if (result.status === "approved") {
      try {
        await ensureStudentFromApplication(result);
      } catch (syncError) {
        console.error("[students] Failed to sync student record from application:", syncError);
      }
    }

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
    logAdminActivity("delete", "applications", id);
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
  image_url?: string | null;
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("courses")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    logAdminActivity("create", "courses", result.id, data);
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
    image_url: string | null;
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
    logAdminActivity("update", "courses", id, data);
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
    logAdminActivity("delete", "courses", id);
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
      .select("*, profiles(email, full_name), student_courses(id, status, created_at, courses(id, name, language, level))")
      .is("cancelled_at", null)
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

export async function getCancelledStudents() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*, profiles(email, full_name), student_courses(status, created_at, courses(name))")
      .not("cancelled_at", "is", null)
      .order("cancelled_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch cancelled students",
    };
  }
}

export async function updateProfile(
  userId: string,
  data: Partial<{ full_name: string; email: string }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("update", "profiles", userId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update profile" };
  }
}

export async function updateStudent(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    language_level: "beginner" | "intermediate" | "advanced";
    nationality: string;
    passport_number: string;
    visa_status: "processing" | "visa_changed" | "first_extension" | "second_extension" | "third_extension" | "fourth_extension" | "fifth_extension";
    duration_months: string;
    visa_change_date: string;
    visa_last_date: string;
    school_student_id: string;
    cancelled_at: string | null;
    doc_status: "pending" | "submitted" | "checked" | "completed";
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
    logAdminActivity("update", "students", id, data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update student",
    };
  }
}

export async function createStudent(data: {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  passport_number?: string;
  school_student_id?: string;
  duration_months?: string;
  visa_status?: "processing" | "visa_changed" | "first_extension" | "second_extension" | "third_extension" | "fourth_extension" | "fifth_extension";
  visa_change_date?: string;
  visa_last_date?: string;
  language_level?: "beginner" | "intermediate" | "advanced";
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("students")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    logAdminActivity("create", "students", result.id, data);

    after(async () => {
      try {
        await sendAdminStudentAddedNotification({
          name: data.name,
          email: data.email,
          phone: data.phone,
          nationality: data.nationality,
          school_student_id: data.school_student_id,
        });
        console.log("[email] Student added notification sent");
      } catch (emailErr) {
        console.error("[email] Student added notification FAILED:", emailErr);
      }
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create student",
    };
  }
}

export async function deleteStudent(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
    logAdminActivity("delete", "students", id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete student",
    };
  }
}

// ============ STUDENT DOCUMENT CASES ============

export async function getDocumentCases() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("student_document_cases")
      .select(
        "*, students(id, name, school_student_id, nationality, passport_number, phone, language_level, email, cancelled_at, profiles(email, full_name))"
      )
      .order("visa_last_date", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch document cases",
    };
  }
}

export async function createDocumentCase(data: {
  student_id: string;
  visa_status?: string;
  visa_change_date?: string;
  visa_last_date: string;
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("student_document_cases")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    logAdminActivity("create", "student_document_cases", result.id, data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create document case",
    };
  }
}

export async function updateDocumentCase(
  id: string,
  data: { doc_status: "pending" | "submitted" | "checked" | "completed" }
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("student_document_cases")
      .update({
        ...data,
        completed_at: data.doc_status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    logAdminActivity("update", "student_document_cases", id, data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update document case",
    };
  }
}

// ============ AGENTS ============

export async function getAgents() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch agents",
    };
  }
}

export async function createAgent(data: {
  name: string;
  phone?: string;
  email?: string;
  nationality?: string;
  company_name?: string;
  id_passport_number?: string;
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("agents")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    logAdminActivity("create", "agents", result.id, data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create agent",
    };
  }
}

export async function updateAgent(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    email: string;
    nationality: string;
    company_name: string;
    id_passport_number: string;
  }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("agents")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    logAdminActivity("update", "agents", id, data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update agent",
    };
  }
}

export async function deleteAgent(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) throw error;
    logAdminActivity("delete", "agents", id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete agent",
    };
  }
}

// ============ DOCUMENT SERVICES ============

export async function getDocumentServices() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("document_services")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch services" };
  }
}

export async function createDocumentService(data: {
  name: string;
  price_display: string;
  price_thb: number;
  detail?: string;
  processing_time?: string;
  note?: string;
  category: "document" | "copy";
  icon_name?: string;
  sort_order: number;
  is_active: boolean;
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("document_services")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("create", "document_services", result.id, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create service" };
  }
}

export async function updateDocumentService(
  id: string,
  data: Partial<{
    name: string;
    price_display: string;
    price_thb: number;
    detail: string;
    processing_time: string;
    note: string;
    category: "document" | "copy";
    icon_name: string;
    sort_order: number;
    is_active: boolean;
  }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("document_services")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("update", "document_services", id, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update service" };
  }
}

export async function deleteDocumentService(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("document_services").delete().eq("id", id);
    if (error) throw error;
    logAdminActivity("delete", "document_services", id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete service" };
  }
}

// ============ SERVICE REQUESTS ============

export async function getServiceRequests() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch service requests" };
  }
}

export async function createServiceRequest(data: {
  service_id?: string;
  service_name: string;
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  passport_number?: string;
  student_id?: string;
  quantity: number;
  notes?: string;
  price_thb: number;
}) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("service_requests")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("create", "service_requests", result.id, data);
    after(async () => {
      try {
        await sendAdminServiceRequestNotification({
          name: data.name,
          email: data.email,
          phone: data.phone,
          nationality: data.nationality,
          passport_number: data.passport_number,
          service_name: data.service_name,
          quantity: data.quantity,
          notes: data.notes,
          price_thb: data.price_thb,
        });
        console.log("[email] Service request notification sent");
      } catch (emailErr) {
        console.error("[email] Service request notification FAILED:", emailErr);
      }
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create service request" };
  }
}

export async function updateServiceRequest(
  id: string,
  data: Partial<{
    status: "pending" | "processing" | "completed" | "cancelled";
    notes: string;
    quantity: number;
  }>
) {
  const supabase = await createClient();
  try {
    const { data: result, error } = await supabase
      .from("service_requests")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("update", "service_requests", id, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update service request" };
  }
}

export async function deleteServiceRequest(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("service_requests").delete().eq("id", id);
    if (error) throw error;
    logAdminActivity("delete", "service_requests", id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete service request" };
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
    logAdminActivity("create", "student_courses", result.id, data);
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
    logAdminActivity("update", "student_courses", id, { status });
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
    logAdminActivity("delete", "student_courses", id);
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

// ============ RECEIPTS ============

function extractError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && "message" in err) return String((err as Record<string, unknown>).message);
  return fallback;
}

export async function getReceipts() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: extractError(error, "Failed to fetch receipts"), data: [] };
  }
}

export async function createReceipt(data: {
  receipt_no: string;
  student_name: string;
  phone?: string | null;
  email?: string | null;
  passport_no?: string | null;
  course_name: string;
  duration?: string | null;
  course_fee: number;
  visa_fee: number;
  items?: { name: string; amount: number }[] | null;
  total_amount: number;
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  staff_name?: string | null;
  agent_discount?: number | null;
  receipt_note?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
  agent_nationality?: string | null;
  agent_company_register_number?: string | null;
  agent_note?: string | null;
}) {
  const supabase = await createClient();
  try {
    const { data: row, error } = await supabase
      .from("receipts")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("create", "receipts", row.id, data);
    return { success: true, data: row };
  } catch (error) {
    return { success: false, error: extractError(error, "Failed to create receipt") };
  }
}

export async function updateReceipt(id: string, data: Partial<{
  student_name: string;
  phone: string | null;
  email: string | null;
  passport_no: string | null;
  course_name: string;
  duration: string | null;
  course_fee: number;
  visa_fee: number;
  items: { name: string; amount: number }[] | null;
  total_amount: number;
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  staff_name: string | null;
  agent_discount: number | null;
  receipt_note: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_nationality: string | null;
  agent_company_register_number: string | null;
  agent_note: string | null;
}>) {
  const supabase = await createClient();
  try {
    const { data: row, error } = await supabase
      .from("receipts")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    logAdminActivity("update", "receipts", id, data);
    return { success: true, data: row };
  } catch (error) {
    return { success: false, error: extractError(error, "Failed to update receipt") };
  }
}

export async function deleteReceipt(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("receipts").delete().eq("id", id);
    if (error) throw error;
    logAdminActivity("delete", "receipts", id);
    return { success: true };
  } catch (error) {
    return { success: false, error: extractError(error, "Failed to delete receipt") };
  }
}
