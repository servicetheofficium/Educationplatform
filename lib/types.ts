export type Profile = {
  id: string;
  email: string;
  full_name: string;
  user_type: "student" | "admin";
  created_at: string;
};

export type VisaStatus = "processing" | "visa_changed" | "first_extension" | "second_extension" | "third_extension" | "fourth_extension" | "fifth_extension";

export type Student = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  application_id: string | null;
  enrollment_date: string;
  phone: string;
  address: string;
  language_level: "beginner" | "intermediate" | "advanced";
  nationality: string | null;
  passport_number: string | null;
  visa_status: VisaStatus | null;
  duration_months: string | null;
  visa_change_date: string | null;
  visa_last_date: string | null;
  school_student_id: string | null;
  cancelled_at: string | null;
  doc_status: "pending" | "submitted" | "checked" | "completed" | null;
  note: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  name: string;
  description: string;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  max_students: number;
  duration_weeks: number;
  price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentCourse = {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date: string;
  status: "active" | "completed" | "dropped";
  created_at: string;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  course_id: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "contacted" | "cancelled";
  nationality: string | null;
  passport_number: string | null;
  visa_status: VisaStatus | null;
  duration_months: string | null;
  visa_change_date: string | null;
  visa_last_date: string | null;
  school_student_id: string | null;
  doc_status: "pending" | "submitted" | "checked" | "completed" | null;
  created_at: string;
  updated_at: string;
  courses: { name: string; language: string } | null;
};

export type StudentWithProfile = Student & {
  profiles: { email: string; full_name: string } | null;
  student_courses?: {
    id: string;
    status: "active" | "completed" | "dropped";
    created_at: string;
    courses: { id: string; name: string; language: string; level: "beginner" | "intermediate" | "advanced" } | null;
  }[] | null;
};

export type StudentDocumentCase = {
  id: string;
  student_id: string;
  visa_status: VisaStatus | null;
  visa_change_date: string | null;
  visa_last_date: string;
  doc_status: "pending" | "submitted" | "checked" | "completed";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentDocumentCaseWithStudent = StudentDocumentCase & {
  students: {
    id: string;
    name: string | null;
    school_student_id: string | null;
    nationality: string | null;
    passport_number: string | null;
    phone: string | null;
    language_level: "beginner" | "intermediate" | "advanced" | null;
    email: string | null;
    cancelled_at: string | null;
    profiles: { email: string; full_name: string } | null;
  } | null;
};

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  user_type: "admin" | "student";
}

export type DocumentService = {
  id: string;
  name: string;
  price_display: string;
  price_thb: number;
  detail: string | null;
  processing_time: string | null;
  note: string | null;
  category: "document" | "copy";
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestStatus = "pending" | "processing" | "completed" | "cancelled";

export type ReceiptItem = { name: string; amount: number };

export type Receipt = {
  id: string;
  receipt_no: string;
  student_name: string;
  phone: string | null;
  email: string | null;
  passport_no: string | null;
  course_name: string;
  duration: string | null;
  course_fee: number;
  visa_fee: number;
  items: ReceiptItem[] | null;
  total_amount: number;
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  remaining_amount: number;
  next_payment_date: string | null;
  staff_name: string | null;
  agent_discount: number | null;
  receipt_note: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_nationality: string | null;
  agent_company_register_number: string | null;
  agent_note: string | null;
  created_at: string;
};

export type ServiceRequest = {
  id: string;
  service_id: string | null;
  service_name: string;
  name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  passport_number: string | null;
  student_id: string | null;
  quantity: number;
  notes: string | null;
  status: ServiceRequestStatus;
  price_thb: number;
  created_at: string;
  updated_at: string;
};

export type Agent = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  company_name: string | null;
  id_passport_number: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminActivityLog = {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  action: "create" | "update" | "delete";
  target_table: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};
