"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as dialog from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import * as select from "@/components/ui/select";
import * as sheet from "@/components/ui/sheet";
import * as table from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createCourse, deleteCourse, updateCourse } from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { Course } from "@/lib/types";
import {
  BookOpen,
  Users,
  BarChart3,
  Download,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";

interface AdminDashboardProps {
  courses: Course[];
  activeStudentCount: number;
  totalEnrollmentCount: number;
  adminName?: string;
}

type CourseForm = {
  name: string;
  description: string;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  max_students: number;
  duration_weeks: number;
  price: number;
  image_url: string;
};

const COURSES_PER_PAGE = 5;

const EMPTY_FORM: CourseForm = {
  name: "",
  description: "",
  language: "",
  level: "beginner",
  max_students: 20,
  duration_weeks: 12,
  price: 0,
  image_url: "",
};

export function AdminDashboard({
  courses,
  activeStudentCount,
  totalEnrollmentCount,
  adminName,
}: AdminDashboardProps) {
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);
  const [liveStudentCount] = useState(activeStudentCount);
  const [liveTotalCount] = useState(totalEnrollmentCount);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const [courseForm, setCourseForm] = useState<CourseForm>(EMPTY_FORM);
  const [coursePage, setCoursePage] = useState(1);
  const totalCoursePages = Math.max(1, Math.ceil(localCourses.length / COURSES_PER_PAGE));
  const paginatedCourses = localCourses.slice(
    (coursePage - 1) * COURSES_PER_PAGE,
    coursePage * COURSES_PER_PAGE
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(localCourses.length / COURSES_PER_PAGE));
    if (coursePage > maxPage) setCoursePage(maxPage);
  }, [localCourses.length, coursePage]);

  const refreshCourses = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (data) setLocalCourses(data as Course[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, refreshCourses)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshCourses]);

  useEffect(() => {
    if (editingCourse) {
      setCourseForm({
        name: editingCourse.name,
        description: editingCourse.description,
        language: editingCourse.language,
        level: editingCourse.level,
        max_students: editingCourse.max_students,
        duration_weeks: editingCourse.duration_weeks,
        price: editingCourse.price,
        image_url: editingCourse.image_url ?? "",
      });
    }
  }, [editingCourse]);

  const stats = [
    {
      label: "Total Courses",
      value: localCourses.length,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Students",
      value: liveStudentCount,
      icon: Users,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Enrollments",
      value: liveTotalCount,
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const handleCreate = async () => {
    setSaving(true);
    const res = await createCourse({
      ...courseForm,
      image_url: courseForm.image_url || null,
    });
    if (res.success && res.data) {
      setLocalCourses((prev) => [res.data as Course, ...prev]);
      setCreateOpen(false);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;
    setSaving(true);
    const res = await updateCourse(editingCourse.id, {
      ...courseForm,
      image_url: courseForm.image_url || null,
    });
    if (res.success && res.data) {
      setLocalCourses((prev) =>
        prev.map((c) => (c.id === editingCourse.id ? (res.data as Course) : c))
      );
      setEditingCourse(null);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    setSaving(true);
    const res = await deleteCourse(deletingCourse.id);
    if (res.success) {
      setLocalCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id));
      setDeletingCourse(null);
    }
    setSaving(false);
  };

  const field = (key: keyof CourseForm) => ({
    value: String(courseForm[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setCourseForm((prev) => ({
        ...prev,
        [key]:
          key === "max_students" || key === "duration_weeks" || key === "price"
            ? Number(e.target.value)
            : e.target.value,
      })),
  });

  return (
    <main className="px-8 py-10 overflow-auto">
      {adminName && (
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8">
          Welcome back, {adminName}
        </h1>
      )}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50 mb-12">
          <CardHeader className="flex flex-row items-center justify-between p-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BookOpen size={24} className="text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-900 dark:text-white">
                  Manage Courses
                </CardTitle>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  View and manage all language courses
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center gap-2"
                onClick={() => {
                  const headers = ["Course Name", "Language", "Level", "Max Students", "Duration (weeks)", "Tuition Fees"];
                  const escape = (v: string | number) => { const s = String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; };
                  const rows = [headers.join(","), ...localCourses.map((c) => [escape(c.name), escape(c.language), escape(c.level), c.max_students, c.duration_weeks, c.price].join(","))];
                  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `courses_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download size={16} />
                Export CSV
              </Button>
              <Button
                className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2"
                onClick={() => { setCourseForm(EMPTY_FORM); setCreateOpen(true); }}
              >
                <Plus size={16} />
                Add Course
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {localCourses.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">
                No courses yet. Add one above.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
              <table.Table>
                <table.TableHeader>
                  <table.TableRow>
                    <table.TableHead>Course Name</table.TableHead>
                    <table.TableHead>Language</table.TableHead>
                    <table.TableHead>Level</table.TableHead>
                    <table.TableHead>Max Students</table.TableHead>
                    <table.TableHead>Tuition Fees</table.TableHead>
                    <table.TableHead>Actions</table.TableHead>
                  </table.TableRow>
                </table.TableHeader>
                <table.TableBody>
                  {paginatedCourses.map((course) => (
                    <table.TableRow key={course.id}>
                      <table.TableCell className="font-medium text-slate-900 dark:text-white">
                        {course.name}
                      </table.TableCell>
                      <table.TableCell className="text-slate-600 dark:text-slate-300">
                        {course.language}
                      </table.TableCell>
                      <table.TableCell>
                        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-0 capitalize">
                          {course.level}
                        </Badge>
                      </table.TableCell>
                      <table.TableCell className="text-slate-600 dark:text-slate-300">
                        {course.max_students}
                      </table.TableCell>
                      <table.TableCell className="font-semibold text-slate-900 dark:text-white">
                        ฿{course.price.toLocaleString()}
                      </table.TableCell>
                      <table.TableCell>
                        <div className="flex gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 h-auto p-0 flex items-center gap-1"
                            onClick={() => setEditingCourse(course)}
                          >
                            <Pencil size={13} />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 h-auto p-0 flex items-center gap-1"
                            onClick={() => setDeletingCourse(course)}
                          >
                            <Trash2 size={13} />
                            Delete
                          </Button>
                        </div>
                      </table.TableCell>
                    </table.TableRow>
                  ))}
                </table.TableBody>
              </table.Table>
              </div>
            )}
            {localCourses.length > COURSES_PER_PAGE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {(coursePage - 1) * COURSES_PER_PAGE + 1}–
                  {Math.min(coursePage * COURSES_PER_PAGE, localCourses.length)} of{" "}
                  {localCourses.length} courses
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 flex items-center gap-1"
                    disabled={coursePage === 1}
                    onClick={() => setCoursePage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </Button>
                  <span className="text-sm text-slate-500 dark:text-slate-400 px-2">
                    {coursePage} / {totalCoursePages}
                  </span>
                  <Button
                    size="sm"
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 flex items-center gap-1"
                    disabled={coursePage === totalCoursePages}
                    onClick={() => setCoursePage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Course Sheet */}
      <sheet.Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <sheet.SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <sheet.SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <sheet.SheetTitle className="text-lg font-semibold">Add New Course</sheet.SheetTitle>
            <sheet.SheetDescription>Fill in the course details below.</sheet.SheetDescription>
          </sheet.SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <CourseFormFields form={courseForm} setForm={setCourseForm} field={field} />
          </div>
          <sheet.SheetFooter className="px-6 py-4 border-t border-border">
            <Button
              onClick={handleCreate}
              disabled={saving || !courseForm.name || !courseForm.language}
              className="w-full bg-brand-600 hover:bg-brand-700"
              size="lg"
            >
              {saving ? "Saving..." : "Create Course"}
            </Button>
          </sheet.SheetFooter>
        </sheet.SheetContent>
      </sheet.Sheet>

      {/* Edit Course Sheet */}
      <sheet.Sheet open={!!editingCourse} onOpenChange={(o) => !o && setEditingCourse(null)}>
        <sheet.SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <sheet.SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <sheet.SheetTitle className="text-lg font-semibold">Edit Course</sheet.SheetTitle>
            <sheet.SheetDescription>{editingCourse?.name}</sheet.SheetDescription>
          </sheet.SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <CourseFormFields form={courseForm} setForm={setCourseForm} field={field} />
          </div>
          <sheet.SheetFooter className="px-6 py-4 border-t border-border">
            <Button
              onClick={handleUpdate}
              disabled={saving || !courseForm.name || !courseForm.language}
              className="w-full bg-brand-600 hover:bg-brand-700"
              size="lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </sheet.SheetFooter>
        </sheet.SheetContent>
      </sheet.Sheet>

      {/* Delete Confirm Dialog */}
      <dialog.Dialog open={!!deletingCourse} onOpenChange={(o) => !o && setDeletingCourse(null)}>
        <dialog.DialogContent className="max-w-sm">
          <dialog.DialogHeader>
            <dialog.DialogTitle>Delete Course</dialog.DialogTitle>
          </dialog.DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deletingCourse?.name}</span>? This cannot be undone.
          </p>
          <dialog.DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </dialog.DialogFooter>
        </dialog.DialogContent>
      </dialog.Dialog>
    </main>
  );
}

function CourseFormFields({
  form,
  setForm,
  field,
}: {
  form: CourseForm;
  setForm: React.Dispatch<React.SetStateAction<CourseForm>>;
  field: (key: keyof CourseForm) => {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };
}) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("course-images")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("course-images")
        .getPublicUrl(data.path);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Course Name *</label>
          <Input placeholder="e.g. Japanese Beginner" {...field("name")} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Language *</label>
          <Input placeholder="e.g. Japanese" {...field("language")} />
        </div>
      </div>

      <div className="space-y-1.5 w-full">
        <label className="text-sm font-medium">Level</label>
        <select.Select
          value={form.level}
          onValueChange={(val) =>
            setForm((prev) => ({ ...prev, level: (val ?? "beginner") as CourseForm["level"] }))
          }
        >
          <select.SelectTrigger className="w-full">
            <select.SelectValue />
          </select.SelectTrigger>
          <select.SelectContent className="w-full">
            <select.SelectItem value="beginner">Beginner</select.SelectItem>
            <select.SelectItem value="intermediate">Intermediate</select.SelectItem>
            <select.SelectItem value="advanced">Advanced</select.SelectItem>
          </select.SelectContent>
        </select.Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea placeholder="Short course description..." rows={6} {...field("description")} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Course Image</label>
        {form.image_url && (
          <div className="relative h-36 rounded-lg overflow-hidden bg-slate-100 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, image_url: "" }))}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-md text-sm text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading…</>
          ) : (
            <><Upload size={14} /> {form.image_url ? "Replace image" : "Upload from device"}</>
          )}
        </label>
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-muted-foreground">or paste URL</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <Input placeholder="https://example.com/photo.jpg" {...field("image_url")} />
        <p className="text-xs text-muted-foreground">Leave blank to show gradient placeholder.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Max Students</label>
          <NumberStepper value={form.max_students} min={1} onChange={(v) => setForm((p) => ({ ...p, max_students: v }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Duration (weeks)</label>
          <NumberStepper value={form.duration_weeks} min={1} onChange={(v) => setForm((p) => ({ ...p, duration_weeks: v }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tuition Fees (THB)</label>
          <NumberStepper value={form.price} min={0} step={100} onChange={(v) => setForm((p) => ({ ...p, price: v }))} />
        </div>
      </div>
    </div>
  );
}
