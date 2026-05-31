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
import { logout } from "@/lib/auth";
import { createCourse, deleteCourse, updateCourse } from "@/lib/crud";
import type { AdminUser, Course } from "@/lib/types";
import * as lucideReact from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { ServicesPanel } from "./services-panel";
import { StudentListPanel } from "./student-list-panel";
import { StudentsPanel } from "./students-panel";

interface AdminDashboardProps {
  user: AdminUser;
  courses: Course[];
  activeStudentCount: number;
  totalEnrollmentCount: number;
}

type View = "dashboard" | "student-list" | "student-applications" | "services" | "settings";

type CourseForm = {
  name: string;
  description: string;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  max_students: number;
  duration_weeks: number;
  price: number;
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
};

export function AdminDashboard({
  user,
  courses,
  activeStudentCount,
  totalEnrollmentCount,
}: AdminDashboardProps) {
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);
  const [loggingOut, setLoggingOut] = useState(false);
  const [liveStudentCount, setLiveStudentCount] = useState(activeStudentCount);
  const [liveTotalCount, setLiveTotalCount] = useState(totalEnrollmentCount);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Course form
  const [courseForm, setCourseForm] = useState<CourseForm>(EMPTY_FORM);

  // Pagination
  const [coursePage, setCoursePage] = useState(1);
  const totalCoursePages = Math.max(1, Math.ceil(localCourses.length / COURSES_PER_PAGE));
  const paginatedCourses = localCourses.slice(
    (coursePage - 1) * COURSES_PER_PAGE,
    coursePage * COURSES_PER_PAGE
  );

  // Clamp page when courses list shrinks
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(localCourses.length / COURSES_PER_PAGE));
    if (coursePage > maxPage) setCoursePage(maxPage);
  }, [localCourses.length, coursePage]);

  // Sync form when opening edit dialog
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
      });
    }
  }, [editingCourse]);

  const stats = [
    {
      label: "Total Courses",
      value: localCourses.length,
      icon: lucideReact.BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Students",
      value: liveStudentCount,
      icon: lucideReact.Users,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Enrollments",
      value: liveTotalCount,
      icon: lucideReact.BarChart3,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const handleCreate = async () => {
    setSaving(true);
    const res = await createCourse(courseForm);
    if (res.success && res.data) {
      setLocalCourses((prev) => [res.data as Course, ...prev]);
      setCreateOpen(false);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;
    setSaving(true);
    const res = await updateCourse(editingCourse.id, courseForm);
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

  const navItems: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: lucideReact.BarChart3 },
    { id: "student-list", label: "Student List", icon: lucideReact.List },
    { id: "student-applications", label: "Student Applications", icon: lucideReact.FileText },
    { id: "services", label: "Services", icon: lucideReact.Wrench },
  ];

  const sidebar = (
    <aside className={`${sidebarOpen ? "w-64" : "w-16"} h-screen sticky top-0 bg-slate-900 border-r border-slate-700/50 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
      <div className={`flex items-center border-b border-slate-700/50 ${sidebarOpen ? "px-6 py-6 justify-between" : "px-3 py-4 justify-center"}`}>
        {sidebarOpen && (
          <div>
            <h1 className="text-xl font-display font-bold text-white">KNC Admin</h1>
            <p className="text-slate-400 text-xs mt-1 truncate">{user.full_name}</p>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-slate-400 hover:text-white transition-colors shrink-0"
        >
          {sidebarOpen ? <lucideReact.PanelLeftClose size={20} /> : <lucideReact.PanelLeftOpen size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            title={!sidebarOpen ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === id
              ? "bg-brand-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={() => setView("settings")}
          title={!sidebarOpen ? "Settings" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "settings"
            ? "bg-brand-600 text-white"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
            } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <lucideReact.Settings size={18} className="shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );

  if (view === "student-list") {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {sidebar}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <StudentListPanel />
        </div>
      </div>
    );
  }

  if (view === "services") {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {sidebar}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <ServicesPanel />
        </div>
      </div>
    );
  }

  if (view === "student-applications") {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {sidebar}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <StudentsPanel
            onBack={() => setView("dashboard")}
            onEnrollmentChange={(delta) => {
              setLiveStudentCount((c) => c + delta);
              setLiveTotalCount((c) => c + delta);
            }}
          />
        </div>
      </div>
    );
  }

  if (view === "settings") {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {sidebar}
        <main className="flex-1 min-w-0 px-8 py-10 overflow-y-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-8">Settings</h2>
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 max-w-md">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-1">Account</h3>
              <p className="text-slate-400 text-sm mb-6">Signed in as {user.full_name}</p>
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <lucideReact.LogOut size={16} />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {sidebar}

      <main className="flex-1 min-w-0 px-8 py-10 overflow-auto">
        {/* Stats */}
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
                <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:border-slate-600 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium">
                          {stat.label}
                        </p>
                        <p className="text-4xl font-bold text-white mt-2">
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

        {/* Courses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 mb-12">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <lucideReact.BookOpen size={24} className="text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    Manage Courses
                  </CardTitle>
                  <p className="text-slate-400 text-sm">
                    View and manage all language courses
                  </p>
                </div>
              </div>
              <Button
                className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2"
                onClick={() => {
                  setCourseForm(EMPTY_FORM);
                  setCreateOpen(true);
                }}
              >
                <lucideReact.Plus size={16} />
                Add Course
              </Button>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {localCourses.length === 0 ? (
                <p className="text-center text-slate-400 py-12">
                  No courses yet. Add one above.
                </p>
              ) : (
                <table.Table>
                  <table.TableHeader>
                    <table.TableRow className="border-slate-700">
                      <table.TableHead className="text-slate-300">Course Name</table.TableHead>
                      <table.TableHead className="text-slate-300">Language</table.TableHead>
                      <table.TableHead className="text-slate-300">Level</table.TableHead>
                      <table.TableHead className="text-slate-300">Max Students</table.TableHead>
                      <table.TableHead className="text-slate-300">Tuition Fees</table.TableHead>
                      <table.TableHead className="text-slate-300">Actions</table.TableHead>
                    </table.TableRow>
                  </table.TableHeader>
                  <table.TableBody>
                    {paginatedCourses.map((course) => (
                      <table.TableRow
                        key={course.id}
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <table.TableCell className="font-medium text-white">
                          {course.name}
                        </table.TableCell>
                        <table.TableCell className="text-slate-300">
                          {course.language}
                        </table.TableCell>
                        <table.TableCell>
                          <Badge className="bg-blue-500/20 text-blue-300 border-0 capitalize">
                            {course.level}
                          </Badge>
                        </table.TableCell>
                        <table.TableCell className="text-slate-300">
                          {course.max_students}
                        </table.TableCell>
                        <table.TableCell className="font-semibold text-white">
                          ฿{course.price.toLocaleString()}
                        </table.TableCell>
                        <table.TableCell>
                          <div className="flex gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 h-auto p-0 flex items-center gap-1"
                              onClick={() => setEditingCourse(course)}
                            >
                              <lucideReact.Pencil size={13} />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 h-auto p-0 flex items-center gap-1"
                              onClick={() => setDeletingCourse(course)}
                            >
                              <lucideReact.Trash2 size={13} />
                              Delete
                            </Button>
                          </div>
                        </table.TableCell>
                      </table.TableRow>
                    ))}
                  </table.TableBody>
                </table.Table>
              )}
              {localCourses.length > COURSES_PER_PAGE && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Showing {(coursePage - 1) * COURSES_PER_PAGE + 1}–
                    {Math.min(coursePage * COURSES_PER_PAGE, localCourses.length)} of{" "}
                    {localCourses.length} courses
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white disabled:opacity-30"
                      disabled={coursePage === 1}
                      onClick={() => setCoursePage((p) => p - 1)}
                    >
                      <lucideReact.ChevronLeft size={16} />
                      Prev
                    </Button>
                    <span className="text-sm text-slate-400 px-2">
                      {coursePage} / {totalCoursePages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white disabled:opacity-30"
                      disabled={coursePage === totalCoursePages}
                      onClick={() => setCoursePage((p) => p + 1)}
                    >
                      Next
                      <lucideReact.ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* ── Create Course Sheet ── */}
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
              size={"lg"}
            >
              {saving ? "Saving..." : "Create Course"}
            </Button>
          </sheet.SheetFooter>
        </sheet.SheetContent>
      </sheet.Sheet>

      {/* ── Edit Course Sheet ── */}
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
              size={"lg"}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </sheet.SheetFooter>
        </sheet.SheetContent>
      </sheet.Sheet>

      {/* ── Delete Confirm Dialog ── */}
      <dialog.Dialog
        open={!!deletingCourse}
        onOpenChange={(o) => !o && setDeletingCourse(null)}
      >
        <dialog.DialogContent className="max-w-sm">
          <dialog.DialogHeader>
            <dialog.DialogTitle>Delete Course</dialog.DialogTitle>
          </dialog.DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deletingCourse?.name}
            </span>
            ? This cannot be undone.
          </p>
          <dialog.DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </dialog.DialogFooter>
        </dialog.DialogContent>
      </dialog.Dialog>
    </div>
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
            setForm((prev) => ({
              ...prev,
              level: (val ?? "beginner") as CourseForm["level"],
            }))
          }
        >
          <select.SelectTrigger className='w-full'>
            <select.SelectValue />
          </select.SelectTrigger>
          <select.SelectContent className='w-full'>
            <select.SelectItem value="beginner">Beginner</select.SelectItem>
            <select.SelectItem value="intermediate">Intermediate</select.SelectItem>
            <select.SelectItem value="advanced">Advanced</select.SelectItem>
          </select.SelectContent>
        </select.Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Short course description..."
          rows={6}
          {...field("description")}

        />
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
