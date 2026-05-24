"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Course, StudentCourse } from "./types";

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCourses(data || []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch courses"
        );
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
};

export const useCoursesByLanguage = (language: string) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!language) return;
    const fetchCourses = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("language", language)
          .order("level", { ascending: true });

        if (error) throw error;
        setCourses(data || []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch courses"
        );
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [language]);

  return { courses, loading, error };
};

export const useStudentEnrollments = (studentId: string) => {
  const [enrollments, setEnrollments] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    const fetchEnrollments = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("student_courses")
          .select("*")
          .eq("student_id", studentId)
          .order("enrollment_date", { ascending: false });

        if (error) throw error;
        setEnrollments(data || []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch enrollments"
        );
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [studentId]);

  return { enrollments, loading, error };
};

export const useEnrollStudent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enroll = async (studentId: string, courseId: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("student_courses")
        .insert([{ student_id: studentId, course_id: courseId, status: "active" }])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to enroll student";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { enroll, loading, error };
};

export const useUpdateEnrollmentStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    enrollmentId: string,
    status: "active" | "completed" | "dropped"
  ) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("student_courses")
        .update({ status })
        .eq("id", enrollmentId)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
};
