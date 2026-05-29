"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  LogOut,
  BarChart3,
  Users,
  BookOpen,
  Settings,
  Plus,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logout } from "@/lib/auth";
import { createCourse, updateCourse, deleteCourse } from "@/lib/crud";
import { StudentsPanel } from "./students-panel";
import type { AdminUser, Course } from "@/lib/types";

interface AdminDashboardProps {
  user: AdminUser;
  courses: Course[];
  activeStudentCount: number;
  totalEnrollmentCount: number;
}

type View = "dashboard" | "students" | "settings";

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
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "students", label: "Students", icon: Users },
  ];

  const sidebar = (
    <aside className={`${sidebarOpen ? "w-64" : "w-16"} min-h-screen bg-slate-900 border-r border-slate-700/50 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
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
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            title={!sidebarOpen ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === id
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
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            view === "settings"
              ? "bg-brand-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <Settings size={18} className="shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );

  if (view === "students") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {sidebar}
        <div className="flex-1">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {sidebar}
        <main className="flex-1 px-8 py-10">
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
                <LogOut size={16} />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {sidebar}

      <main className="flex-1 px-8 py-10 overflow-auto">
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
                  <BookOpen size={24} className="text-blue-400" />
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
                <Plus size={16} />
                Add Course
              </Button>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {localCourses.length === 0 ? (
                <p className="text-center text-slate-400 py-12">
                  No courses yet. Add one above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Course Name</TableHead>
                      <TableHead className="text-slate-300">Language</TableHead>
                      <TableHead className="text-slate-300">Level</TableHead>
                      <TableHead className="text-slate-300">Max Students</TableHead>
                      <TableHead className="text-slate-300">Tuition Fees</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCourses.map((course) => (
                      <TableRow
                        key={course.id}
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <TableCell className="font-medium text-white">
                          {course.name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {course.language}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 text-blue-300 border-0 capitalize">
                            {course.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {course.max_students}
                        </TableCell>
                        <TableCell className="font-semibold text-white">
                          ฿{course.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 h-auto p-0 flex items-center gap-1"
                              onClick={() => setEditingCourse(course)}
                            >
                              <Pencil size={13} />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 h-auto p-0 flex items-center gap-1"
                              onClick={() => setDeletingCourse(course)}
                            >
                              <Trash2 size={13} />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <ChevronLeft size={16} />
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
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* ── Create Course Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <CourseFormFields form={courseForm} setForm={setCourseForm} field={field} />
          <DialogFooter showCloseButton>
            <Button
              onClick={handleCreate}
              disabled={saving || !courseForm.name || !courseForm.language}
              className="bg-brand-600 hover:bg-brand-700"
            >
              {saving ? "Saving..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Course Dialog ── */}
      <Dialog
        open={!!editingCourse}
        onOpenChange={(o) => !o && setEditingCourse(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <CourseFormFields form={courseForm} setForm={setCourseForm} field={field} />
          <DialogFooter showCloseButton>
            <Button
              onClick={handleUpdate}
              disabled={saving || !courseForm.name || !courseForm.language}
              className="bg-brand-600 hover:bg-brand-700"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={!!deletingCourse}
        onOpenChange={(o) => !o && setDeletingCourse(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deletingCourse?.name}
            </span>
            ? This cannot be undone.
          </p>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Course Name *</label>
          <Input placeholder="e.g. Japanese Beginner" {...field("name")} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Language *</label>
          <Input placeholder="e.g. Japanese" {...field("language")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Level</label>
        <Select
          value={form.level}
          onValueChange={(val) =>
            setForm((prev) => ({
              ...prev,
              level: (val ?? "beginner") as CourseForm["level"],
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Short course description..."
          rows={3}
          {...field("description")}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Max Students</label>
          <Input type="number" min={1} {...field("max_students")} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Duration (weeks)</label>
          <Input type="number" min={1} {...field("duration_weeks")} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tuition Fees (THB)</label>
          <Input type="number" min={0} step="0.01" {...field("price")} />
        </div>
      </div>
    </div>
  );
}
