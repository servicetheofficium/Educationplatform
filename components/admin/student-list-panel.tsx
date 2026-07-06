"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Users, Pencil, XCircle, Search, Plus, Download, X, ChevronsUpDown, Check, Languages } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getStudents, getApplications, getCourses,
  createApplication, updateApplication, updateStudent, updateProfile,
  createEnrollment, deleteEnrollment,
} from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { StudentWithProfile, Application, Course, VisaStatus } from "@/lib/types";

const PER_PAGE = 10;

const VISA_LABELS: Record<VisaStatus, string> = {
  processing:        "Processing",
  visa_changed:      "Visa Changed",
  first_extension:   "1st Extension",
  second_extension:  "2nd Extension",
  third_extension:   "3rd Extension",
  fourth_extension:  "4th Extension",
  fifth_extension:   "5th Extension",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function courseLevelLabel(course: { name: string; level: string } | null, fallbackLevel: string | null) {
  if (course) return course.name;
  return fallbackLevel ? capitalize(fallbackLevel) : null;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((p) => !p); setQ(""); }}
        className="w-full h-10 flex items-center justify-between gap-2 px-3 rounded-lg border border-input bg-transparent dark:bg-input/30 text-sm transition-colors hover:border-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-[300] top-full left-0 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-3">No results.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left transition-colors hover:bg-accent ${value === opt.value ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}
                >
                  <Check size={13} className={value === opt.value ? "opacity-100 text-blue-500" : "opacity-0"} />
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const LANGUAGE_TABS = [
  { value: "all", label: "All Students" },
  { value: "thai", label: "Thai Language" },
  { value: "english", label: "English Language" },
  { value: "japanese", label: "Japanese Language" },
] as const;
type LanguageTab = typeof LANGUAGE_TABS[number]["value"];

type RowSource = "student" | "application";

type Row = {
  id: string;
  source: RowSource;
  num: number;
  name: string;
  email: string | null;
  user_id: string | null;
  school_student_id: string | null;
  nationality: string | null;
  passport_number: string | null;
  phone: string | null;
  duration_months: string | null;
  course_level: string | null;
  course_id: string | null;
  enrollment_id: string | null;
  language_level: "beginner" | "intermediate" | "advanced" | null;
  language: string | null;
  enrolled_date: string;
  visa_status: VisaStatus | null;
  visa_change_date: string | null;
  visa_last_date: string | null;
};

type EditForm = {
  name: string;
  email: string;
  school_student_id: string;
  nationality: string;
  passport_number: string;
  phone: string;
  duration_months: string;
  course_id: string;
  language_level: "beginner" | "intermediate" | "advanced" | "";
  visa_status: VisaStatus | "";
  visa_change_date: string;
  visa_last_date: string;
};

function currentEnrollment(sc: StudentWithProfile["student_courses"]) {
  if (!sc || sc.length === 0) return null;
  const active = sc.filter((e) => e.status === "active");
  const pool = active.length > 0 ? active : sc;
  return pool.reduce((latest, e) => (new Date(e.created_at) > new Date(latest.created_at) ? e : latest));
}

function buildRows(students: StudentWithProfile[]): Row[] {
  return students
    .map((s) => {
      const enrollment = currentEnrollment(s.student_courses);
      const course = enrollment?.courses ?? null;
      return {
        id: s.id,
        source: "student" as RowSource,
        name: s.profiles?.full_name ?? s.name ?? "—",
        email: s.profiles?.email ?? s.email ?? null,
        user_id: s.user_id,
        school_student_id: s.school_student_id ?? null,
        nationality: s.nationality ?? null,
        passport_number: s.passport_number ?? null,
        phone: s.phone ?? null,
        duration_months: s.duration_months ?? null,
        course_level: courseLevelLabel(course, s.language_level),
        course_id: course?.id ?? null,
        enrollment_id: enrollment?.id ?? null,
        language_level: s.language_level ?? null,
        language: course?.language ?? null,
        enrolled_date: s.enrollment_date,
        visa_status: s.visa_status ?? null,
        visa_change_date: s.visa_change_date ?? null,
        visa_last_date: s.visa_last_date ?? null,
      };
    })
    .sort((a, b) => {
      const diff = new Date(a.enrolled_date).getTime() - new Date(b.enrolled_date).getTime();
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    })
    .map((r, i) => ({ ...r, num: i + 1 }));
}


const columnHelper = createColumnHelper<Row>();

export function StudentListPanel({
  initialStudents,
  initialCourses,
}: {
  initialStudents?: StudentWithProfile[];
  initialCourses?: Course[];
} = {}) {
  const hasInitial = initialStudents !== undefined;
  const [rows, setRows] = useState<Row[]>(() =>
    hasInitial ? buildRows(initialStudents!) : []
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<LanguageTab>("all");

  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", email: "", school_student_id: "", nationality: "", passport_number: "", phone: "",
    duration_months: "", course_id: "", language_level: "",
    visa_status: "", visa_change_date: "", visa_last_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bulkCancelling, setBulkCancelling] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>(initialCourses ?? []);
  const [addForm, setAddForm] = useState({
    name: "", email: "", phone: "", nationality: "", passport_number: "",
    school_student_id: "",
    course_id: "", duration_months: "", visa_status: "" as VisaStatus | "",
    visa_change_date: "", visa_last_date: "",
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => { if (!hasInitial) load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const [s, c] = await Promise.all([getStudents(), getCourses()]);
    const students = s.success ? (s.data as StudentWithProfile[]) : [];
    if (c.success) setCourses(c.data as Course[]);
    setRows(buildRows(students));
    setLoading(false);
  }

  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from("students").select("*, profiles(email, full_name), student_courses(id, status, created_at, courses(id, name, language, level))").is("cancelled_at", null).order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
    ]);
    if (s) setRows(buildRows(s as StudentWithProfile[]));
    if (c) setCourses(c as Course[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-student-list-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_courses" }, refreshData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  function handleTabChange(tab: LanguageTab) {
    setActiveTab(tab);
    setRowSelection({});
  }

  function openAdd() {
    setAddError(null);
    setAddForm({ name: "", email: "", phone: "", nationality: "", passport_number: "", school_student_id: "", course_id: "", duration_months: "", visa_status: "", visa_change_date: "", visa_last_date: "" });
    setAddOpen(true);
  }

  async function handleAdd() {
    if (!addForm.name || !addForm.email) { setAddError("Name and email are required."); return; }
    setAdding(true); setAddError(null);
    const res = await createApplication({ name: addForm.name, email: addForm.email, phone: addForm.phone || undefined, course_id: addForm.course_id || undefined, message: "" });
    if (!res.success) { setAddError((res as { error?: string }).error ?? "Failed."); setAdding(false); return; }
    const freshApps = await getApplications();
    if (freshApps.success) {
      const newest = (freshApps.data as Application[]).find((a) => a.email === addForm.email && a.status === "pending");
      if (newest) {
        await updateApplication(newest.id, {
          status: "approved",
          nationality: addForm.nationality || undefined,
          passport_number: addForm.passport_number || undefined,
          duration_months: addForm.duration_months || undefined,
          visa_status: (addForm.visa_status || undefined) as VisaStatus | undefined,
          visa_change_date: addForm.visa_change_date || undefined,
          visa_last_date: addForm.visa_last_date || undefined,
          school_student_id: addForm.school_student_id || undefined,
        });
      }
    }
    await refreshData();
    setAddOpen(false); setAdding(false);
  }

  function openEdit(row: Row) {
    setSaveError(null);
    setEditingRow(row);
    setEditForm({
      name:              row.name,
      email:             row.email ?? "",
      school_student_id: row.school_student_id ?? "",
      nationality:       row.nationality ?? "",
      passport_number: row.passport_number ?? "",
      phone:           row.phone ?? "",
      duration_months: row.duration_months ?? "",
      course_id:       row.course_id ?? "",
      language_level:  row.language_level ?? "",
      visa_status:     row.visa_status ?? "",
      visa_change_date: row.visa_change_date ?? "",
      visa_last_date:  row.visa_last_date ?? "",
    });
  }

  async function handleSave() {
    if (!editingRow) return;
    setSaving(true); setSaveError(null);

    const sharedPayload = {
      nationality:     editForm.nationality || undefined,
      passport_number: editForm.passport_number || undefined,
      phone:           editForm.phone || undefined,
      duration_months: editForm.duration_months || undefined,
      visa_status:     (editForm.visa_status || undefined) as VisaStatus | undefined,
      visa_change_date: editForm.visa_change_date || undefined,
      visa_last_date:  editForm.visa_last_date || undefined,
    };

    let res: { success: boolean; error?: string };
    let updatedName  = editingRow.name;
    let updatedEmail = editingRow.email;
    let updatedCourseLevel = editingRow.course_level;
    let updatedCourseId    = editingRow.course_id;
    let updatedEnrollmentId = editingRow.enrollment_id;
    let updatedLangLevel   = editingRow.language_level;

    const selectedCourse = courses.find((c) => c.id === editForm.course_id);
    const studentPayload = {
      ...sharedPayload,
      language_level:    (selectedCourse?.level ?? editForm.language_level ?? undefined) as "beginner" | "intermediate" | "advanced" | undefined,
      school_student_id: editForm.school_student_id || undefined,
    };
    res = await updateStudent(editingRow.id, studentPayload);
    if (res.success && editingRow.user_id) {
      const profilePayload: { full_name?: string; email?: string } = {};
      if (editForm.name && editForm.name !== editingRow.name) profilePayload.full_name = editForm.name;
      if (editForm.email && editForm.email !== editingRow.email) profilePayload.email = editForm.email;
      if (Object.keys(profilePayload).length > 0) await updateProfile(editingRow.user_id, profilePayload);
      if (profilePayload.full_name) updatedName  = profilePayload.full_name;
      if (profilePayload.email)     updatedEmail = profilePayload.email;
    }
    if (res.success && editForm.course_id && editForm.course_id !== editingRow.course_id) {
      if (editingRow.enrollment_id) await deleteEnrollment(editingRow.enrollment_id);
      const enrollRes = await createEnrollment({ student_id: editingRow.id, course_id: editForm.course_id, status: "active" });
      if (enrollRes.success) updatedEnrollmentId = enrollRes.data.id;
    }
    if (selectedCourse) {
      updatedCourseId    = selectedCourse.id;
      updatedCourseLevel = selectedCourse.name;
      updatedLangLevel   = selectedCourse.level;
    }

    if (res.success) {
      setRows((prev) => prev.map((r) => r.id === editingRow.id ? {
        ...r,
        name:              updatedName,
        email:             updatedEmail,
        school_student_id: editForm.school_student_id || r.school_student_id,
        course_level:    updatedCourseLevel,
        course_id:       updatedCourseId,
        enrollment_id:   updatedEnrollmentId,
        language_level:  updatedLangLevel,
        nationality:     sharedPayload.nationality     ?? r.nationality,
        passport_number: sharedPayload.passport_number ?? r.passport_number,
        phone:           sharedPayload.phone           ?? r.phone,
        duration_months: sharedPayload.duration_months ?? r.duration_months,
        visa_status:     sharedPayload.visa_status     ?? r.visa_status,
        visa_change_date: sharedPayload.visa_change_date ?? r.visa_change_date,
        visa_last_date:  sharedPayload.visa_last_date  ?? r.visa_last_date,
      } : r));
      setEditingRow(null);
    } else {
      setSaveError((res as { error?: string }).error ?? "Failed to save.");
    }
    setSaving(false);
  }


  function exportCSV(data: Row[]) {
    const headers = [
      "#", "Student Name", "Nationality", "Passport No.", "Phone",
      "Duration (mo.)", "Course / Level", "Visa Change Date", "Visa Last Date", "Visa Status", "Enrolled Date",
    ];
    const escape = (v: string | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = [
      headers.join(","),
      ...data.map((r) => [
        r.num,
        escape(r.name),
        escape(r.nationality),
        escape(r.passport_number),
        escape(r.phone),
        r.duration_months ?? "",
        escape(r.course_level),
        r.visa_change_date ? formatDate(r.visa_change_date) : "",
        r.visa_last_date ? formatDate(r.visa_last_date) : "",
        r.visa_status ? VISA_LABELS[r.visa_status] : "",
        formatDate(r.enrolled_date),
      ].join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const tabCounts = useMemo(() => {
    const counts: Record<LanguageTab, number> = { all: rows.length, thai: 0, english: 0, japanese: 0 };
    for (const r of rows) {
      const lang = (r.language ?? "").toLowerCase();
      if (lang === "thai" || lang === "english" || lang === "japanese") counts[lang] += 1;
    }
    return counts;
  }, [rows]);

  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return rows;
    return rows.filter((r) => (r.language ?? "").toLowerCase() === activeTab);
  }, [rows, activeTab]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.nationality ?? "").toLowerCase().includes(q) ||
      (r.passport_number ?? "").toLowerCase().includes(q) ||
      (r.phone ?? "").includes(q) ||
      (r.course_level ?? "").toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.school_student_id ?? "").toLowerCase().includes(q)
    );
  }, [tabFiltered, search]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(() => [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-blue-500 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-blue-500 cursor-pointer"
        />
      ),
      size: 40,
    }),
    columnHelper.accessor("name", {
      id: "name",
      header: "Student Name",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <Popover>
            <PopoverTrigger className="text-slate-900 dark:text-white font-medium hover:text-blue-500 dark:hover:text-blue-400 hover:underline transition-colors text-left whitespace-nowrap">
              {r.name}
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" side="right" align="start">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{r.source === "student" ? "Registered Student" : "Enrolled via Application"}</p>
              </div>
              <div className="px-4 py-3 space-y-2 text-sm">
                {([
                  ["Nationality", r.nationality],
                  ["Passport No.", r.passport_number],
                  ["Phone", r.phone],
                  ["Duration", r.duration_months || null],
                  ["Course / Level", r.course_level],
                  ["Enrolled Date", formatDate(r.enrolled_date)],
                  ["Visa Change Date", r.visa_change_date ? formatDate(r.visa_change_date) : null],
                  ["Visa Last Date", r.visa_last_date ? formatDate(r.visa_last_date) : null],
                  ["Visa Status", r.visa_status ? VISA_LABELS[r.visa_status] : null],
                ] as [string, string | null][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
                    <span className="text-slate-700 dark:text-slate-200 text-right">{value ?? "—"}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        );
      },
      size: 150,
    }),
    columnHelper.accessor("school_student_id", {
      id: "school_student_id",
      header: "Student ID",
      cell: ({ getValue }) => (
        <span className="text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
          {getValue() ?? <span className="text-slate-400 dark:text-slate-600">—</span>}
        </span>
      ),
      size: 130,
    }),
    columnHelper.accessor("nationality", {
      id: "nationality",
      header: "Nationality",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300">{getValue() ?? "—"}</span>,
      size: 100,
    }),
    columnHelper.accessor("passport_number", {
      id: "passport_number",
      header: "Passport No.",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{getValue() ?? "—"}</span>,
      size: 120,
    }),
    columnHelper.accessor("email", {
      id: "email",
      header: "Email",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300 text-xs">{getValue() ?? "—"}</span>,
      size: 180,
    }),
    columnHelper.accessor("phone", {
      id: "phone",
      header: "Phone",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300">{getValue() ?? "—"}</span>,
      size: 114,
    }),
    columnHelper.accessor("duration_months", {
      id: "duration_months",
      header: "Duration",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300">{getValue() || "—"}</span>,
      size: 72,
    }),
    columnHelper.accessor("course_level", {
      id: "course_level",
      header: "Course / Level",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300 capitalize whitespace-nowrap">{getValue() ?? "—"}</span>,
    }),
    columnHelper.accessor("visa_change_date", {
      id: "visa_change_date",
      header: "Visa Change",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{getValue() ? formatDate(getValue()!) : "—"}</span>,
      size: 110,
    }),
    columnHelper.accessor("visa_last_date", {
      id: "visa_last_date",
      header: "Visa Last",
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{getValue() ? formatDate(getValue()!) : "—"}</span>,
      size: 100,
    }),
    columnHelper.accessor("visa_status", {
      id: "visa_status",
      header: "Visa Status",
      cell: ({ row, getValue }) => {
        const r = row.original;
        return (
          <Select
            value={getValue() ?? ""}
            onValueChange={async (val) => {
              const status = val as VisaStatus;
              const res = r.source === "student"
                ? await updateStudent(r.id, { visa_status: status })
                : await updateApplication(r.id, { visa_status: status });
              if (res.success) {
                setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, visa_status: status } : x));
              }
            }}
          >
            <SelectTrigger className="h-7 w-32 text-xs bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(VISA_LABELS) as [VisaStatus, string][]).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
      size: 140,
    }),
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    initialState: {
      pagination: { pageSize: PER_PAGE, pageIndex: 0 },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  async function handleBulkCancel() {
    setBulkCancelling(true);
    const now = new Date().toISOString();
    await Promise.all(selectedRows.map((row) =>
      row.original.source === "student"
        ? updateStudent(row.original.id, { cancelled_at: now })
        : updateApplication(row.original.id, { status: "cancelled" })
    ));
    const cancelledIds = new Set(selectedRows.map((r) => r.original.id));
    setRows((prev) => prev.filter((r) => !cancelledIds.has(r.id)).map((r, i) => ({ ...r, num: i + 1 })));
    setRowSelection({});
    setShowCancelConfirm(false);
    setBulkCancelling(false);
  }

  // Reset to first page on search/tab change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { table.setPageIndex(0); }, [search, activeTab]);

  const { pageIndex } = table.getState().pagination;
  const pageCount = Math.max(1, table.getPageCount());
  const total = filtered.length;
  const from = total === 0 ? 0 : pageIndex * PER_PAGE + 1;
  const to = Math.min((pageIndex + 1) * PER_PAGE, total);

  return (
    <main className="px-6 py-12">
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
        <CardHeader className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users size={24} className="text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Student List</CardTitle>
              <p className="text-slate-500 dark:text-slate-400 text-sm">All enrolled students</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* ── Language Tabs ── */}
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as LanguageTab)} className="w-full mb-4">
            <TabsList
              variant="line"
              className="w-full justify-start h-auto pb-0 border-b border-slate-200 dark:border-slate-700 rounded-none gap-0 [&>[data-slot=tabs-trigger]]:text-slate-500 dark:[&>[data-slot=tabs-trigger]]:text-slate-400 [&>[data-slot=tabs-trigger][data-active]]:text-slate-900 dark:[&>[data-slot=tabs-trigger][data-active]]:text-white [&>[data-slot=tabs-trigger]]:after:bg-brand-500 [&>[data-slot=tabs-trigger]]:px-5 [&>[data-slot=tabs-trigger]]:py-3"
            >
              {LANGUAGE_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  <Languages size={15} />
                  {t.label}
                  {!loading && (
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 text-xs">
                      {tabCounts[t.value]}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* ── Persistent Toolbar ── */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {selectedCount > 0 && (
              <div className="flex items-center gap-1.5 h-9 px-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg shrink-0">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap mr-1">{selectedCount} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={selectedCount !== 1}
                  onClick={() => openEdit(selectedRows[0].original)}
                  className="h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40"
                >
                  <Pencil size={13} className="mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  className="h-7 px-2.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  <XCircle size={13} className="mr-1" /> Cancel
                </Button>
                <button
                  onClick={() => setRowSelection({})}
                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="relative flex-1 min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, nationality, passport, phone, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <Button onClick={openAdd} className="h-9 bg-brand-600 hover:bg-brand-700 flex items-center gap-2 shrink-0">
              <Plus size={16} /> Add Student
            </Button>
            <Button
              onClick={() => exportCSV(filtered)}
              className="h-9 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0"
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-16">No enrolled students yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <table className="w-full table-auto border-collapse text-sm" style={{ minWidth: "1096px" }}>
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-200 dark:border-slate-700">
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            style={{}}
                            className="h-11 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap bg-slate-50 dark:bg-slate-800/80 align-middle"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-12 text-slate-500 dark:text-slate-400">
                          No results found.
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className={`border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${row.getIsSelected() ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              style={{}}
                              className="px-4 py-3 align-middle"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {total > 0 ? `Showing ${from}–${to} of ${total}` : "No results"}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                    <ChevronLeft size={16} /> Prev
                  </Button>
                  <span className="text-sm text-slate-500 dark:text-slate-400 px-2">{pageIndex + 1} / {pageCount}</span>
                  <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Student Sheet ── */}
      <Sheet open={!!editingRow} onOpenChange={(o) => !o && setEditingRow(null)}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Edit Student</SheetTitle>
            <SheetDescription>{editingRow?.name}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <Input className="w-full" placeholder="e.g. John Smith" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input className="w-full" type="email" placeholder="e.g. john@email.com" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Student ID</label>
              <Input className="w-full font-mono" placeholder="e.g. K202606001E" value={editForm.school_student_id} onChange={(e) => setEditForm((f) => ({ ...f, school_student_id: e.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nationality</label>
              <Input className="w-full" placeholder="e.g. Japanese" value={editForm.nationality} onChange={(e) => setEditForm((f) => ({ ...f, nationality: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Passport No.</label>
              <Input className="w-full" placeholder="e.g. AB123456" value={editForm.passport_number} onChange={(e) => setEditForm((f) => ({ ...f, passport_number: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <Input className="w-full" placeholder="e.g. 0812345678" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration</label>
              <Input className="w-full" placeholder="e.g. 5 mo. or 5+6 mo." value={editForm.duration_months} onChange={(e) => setEditForm((f) => ({ ...f, duration_months: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Course</label>
              <SearchableSelect
                value={editForm.course_id}
                onChange={(v) => setEditForm((f) => ({ ...f, course_id: v }))}
                options={courses.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select course"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Status</label>
              <SearchableSelect
                value={editForm.visa_status}
                onChange={(v) => setEditForm((f) => ({ ...f, visa_status: v as VisaStatus }))}
                options={(Object.entries(VISA_LABELS) as [VisaStatus, string][]).map(([val, label]) => ({ value: val, label }))}
                placeholder="Select status"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Change Date</label>
              <DatePicker value={editForm.visa_change_date} onChange={(v) => setEditForm((f) => ({ ...f, visa_change_date: v }))} placeholder="Select visa change date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Last Date</label>
              <DatePicker value={editForm.visa_last_date} onChange={(v) => setEditForm((f) => ({ ...f, visa_last_date: v }))} placeholder="Select visa last date" />
            </div>
            {saveError && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>}
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving} className="w-full bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Cancel Confirm Dialog ── */}
      <Dialog open={showCancelConfirm} onOpenChange={(o) => !o && setShowCancelConfirm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancel Enrollment{selectedCount > 1 ? "s" : ""}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedCount === 1
              ? <><span>Cancel enrollment for </span><span className="font-semibold text-foreground">{selectedRows[0]?.original.name}</span><span>? They will be moved to the Cancelled list.</span></>
              : <><span>Cancel enrollment for </span><span className="font-semibold text-foreground">{selectedCount} students</span><span>? They will be moved to the Cancelled list.</span></>
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={bulkCancelling}>Keep</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleBulkCancel} disabled={bulkCancelling}>
              {bulkCancelling ? "Cancelling..." : "Cancel Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Student Sheet ── */}
      <Sheet open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Add Student</SheetTitle>
            <SheetDescription>Create a new student account and record.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name *</label>
              <Input className="w-full" placeholder="e.g. John Smith" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email *</label>
              <Input className="w-full" type="email" placeholder="e.g. john@email.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <Input className="w-full" placeholder="e.g. 0812345678" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nationality</label>
              <Input className="w-full" placeholder="e.g. Japanese" value={addForm.nationality} onChange={(e) => setAddForm((f) => ({ ...f, nationality: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Passport No.</label>
              <Input className="w-full" placeholder="e.g. AB123456" value={addForm.passport_number} onChange={(e) => setAddForm((f) => ({ ...f, passport_number: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Student ID</label>
              <Input className="w-full font-mono" placeholder="e.g. K202606001E" value={addForm.school_student_id} onChange={(e) => setAddForm((f) => ({ ...f, school_student_id: e.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration</label>
              <Input className="w-full" placeholder="e.g. 5 mo. or 5+6 mo." value={addForm.duration_months} onChange={(e) => setAddForm((f) => ({ ...f, duration_months: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Course</label>
              <SearchableSelect
                value={addForm.course_id}
                onChange={(v) => setAddForm((f) => ({ ...f, course_id: v }))}
                options={courses.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select course"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Status</label>
              <SearchableSelect
                value={addForm.visa_status}
                onChange={(v) => setAddForm((f) => ({ ...f, visa_status: v as VisaStatus }))}
                options={(Object.entries(VISA_LABELS) as [VisaStatus, string][]).map(([val, label]) => ({ value: val, label }))}
                placeholder="Select status"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Change Date</label>
              <DatePicker value={addForm.visa_change_date} onChange={(v) => setAddForm((f) => ({ ...f, visa_change_date: v }))} placeholder="Select visa change date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Last Date</label>
              <DatePicker value={addForm.visa_last_date} onChange={(v) => setAddForm((f) => ({ ...f, visa_last_date: v }))} placeholder="Select visa last date" />
            </div>
            {addError && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{addError}</p>}
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button onClick={handleAdd} disabled={adding || !addForm.name || !addForm.email} className="w-full bg-brand-600 hover:bg-brand-700">
              {adding ? "Adding..." : "Add Student"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
