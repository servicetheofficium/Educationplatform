import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase URL or Anon Key. Please configure .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database
export type User = {
  id: string;
  email: string;
  full_name: string;
  user_type: "student" | "admin";
  created_at: string;
};

export type Student = {
  id: string;
  user_id: string;
  enrollment_date: string;
  phone: string;
  address: string;
  language_level: "beginner" | "intermediate" | "advanced";
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
  created_at: string;
};

export type StudentCourse = {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date: string;
  status: "active" | "completed" | "dropped";
  created_at: string;
};
