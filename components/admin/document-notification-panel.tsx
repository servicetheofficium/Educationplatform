"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Bell, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateDocumentCase, updateApplication } from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { StudentDocumentCaseWithStudent, Application } from "@/lib/types";

const DAYS_THRESHOLD = 45;

type Urgency = "upcoming" | "need_to_prepare" | "urgent" | "overdue";
type DocStatus = "pending" | "submitted" | "checked" | "completed";
type FilterStatus = "all" | Urgency | "completed";

function getDaysRemaining(visaLastDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(visaLastDate);
  last.setHours(0, 0, 0, 0);
  return Math.floor((last.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgency(days: number): Urgency {
  if (days <= 0) return "overdue";
  if (days <= 14) return "urgent";
  if (days <= 30) return "need_to_prepare";
  return "upcoming";
}

const URGENCY_LABEL: Record<Urgency, string> = {
  upcoming: "Upcoming",
  need_to_prepare: "Need to Prepare",
  urgent: "Urgent",
  overdue: "Overdue",
};

const URGENCY_BADGE: Record<Urgency, string> = {
  upcoming: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  need_to_prepare: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  urgent: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  overdue: "bg-red-500/20 text-red-300 border-red-500/30",
};

const DOC_STATUS_BADGE: Record<DocStatus, string> = {
  pending: "bg-slate-500/20 text-slate-300",
  submitted: "bg-blue-500/20 text-blue-300",
  checked: "bg-yellow-500/20 text-yellow-300",
  completed: "bg-green-500/20 text-green-300",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type Row = {
  id: string;
  source: "case" | "app";
  name: string;
  school_student_id: string | null;
  nationality: string | null;
  passport_number: string | null;
  email: string | null;
  phone: string | null;
  course: string | null;
  visa_last_date: string;
  doc_status: DocStatus;
  completed_at: string | null;
  daysRemaining: number;
  urgency: Urgency;
};

function buildRows(cases: StudentDocumentCaseWithStudent[], apps: Application[]): Row[] {
  const caseRows: Row[] = cases
    .filter((c) => {
      if (!c.students || c.students.cancelled_at) return false;
      if (c.doc_status === "completed") return true;
      return getDaysRemaining(c.visa_last_date) <= DAYS_THRESHOLD;
    })
    .map((c) => {
      const days = getDaysRemaining(c.visa_last_date);
      const s = c.students!;
      return {
        id: c.id,
        source: "case" as const,
        name: s.profiles?.full_name ?? s.name ?? "—",
        school_student_id: s.school_student_id ?? null,
        nationality: s.nationality ?? null,
        passport_number: s.passport_number ?? null,
        email: s.profiles?.email ?? s.email ?? null,
        phone: s.phone ?? null,
        course: s.language_level ?? null,
        visa_last_date: c.visa_last_date,
        doc_status: c.doc_status,
        completed_at: c.completed_at,
        daysRemaining: days,
        urgency: getUrgency(days),
      };
    });

  const appRows: Row[] = apps
    .filter((a) => {
      if (!a.visa_last_date) return false;
      return getDaysRemaining(a.visa_last_date) <= DAYS_THRESHOLD;
    })
    .map((a) => {
      const days = getDaysRemaining(a.visa_last_date!);
      return {
        id: a.id,
        source: "app" as const,
        name: a.name,
        school_student_id: a.school_student_id ?? null,
        nationality: a.nationality ?? null,
        passport_number: a.passport_number ?? null,
        email: a.email,
        phone: a.phone ?? null,
        course: a.courses?.name ?? null,
        visa_last_date: a.visa_last_date!,
        doc_status: (a.doc_status ?? "pending") as DocStatus,
        completed_at: null,
        daysRemaining: days,
        urgency: getUrgency(days),
      };
    });

  return [...caseRows, ...appRows].sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function DocumentNotificationPanel({
  initialCases,
  initialApprovedApps,
}: {
  initialCases: StudentDocumentCaseWithStudent[];
  initialApprovedApps: Application[];
}) {
  const [cases, setCases] = useState<StudentDocumentCaseWithStudent[]>(initialCases);
  const [apps, setApps] = useState<Application[]>(initialApprovedApps);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase
        .from("student_document_cases")
        .select(
          "*, students(id, name, school_student_id, nationality, passport_number, phone, language_level, email, cancelled_at, profiles(email, full_name))"
        )
        .order("visa_last_date", { ascending: true }),
      supabase.from("applications").select("*, courses(name)").eq("status", "approved").order("created_at", { ascending: false }),
    ]);
    if (c) setCases(c as StudentDocumentCaseWithStudent[]);
    if (a) setApps(a as Application[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-doc-notifications-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_document_cases" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, refreshData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  async function handleDocStatusChange(row: Row, status: DocStatus) {
    setUpdatingId(row.id);
    if (row.source === "case") {
      const res = await updateDocumentCase(row.id, { doc_status: status });
      if (res.success) {
        const completedAt = status === "completed" ? new Date().toISOString() : null;
        setCases((prev) => prev.map((c) => c.id === row.id ? { ...c, doc_status: status, completed_at: completedAt } : c));
      }
    } else {
      const res = await updateApplication(row.id, { doc_status: status });
      if (res.success) {
        setApps((prev) => prev.map((a) => a.id === row.id ? { ...a, doc_status: status } : a));
      }
    }
    setUpdatingId(null);
  }

  const rows = useMemo(() => buildRows(cases, apps), [cases, apps]);

  const filtered = useMemo(() => {
    let result = rows;
    if (filter !== "all") {
      if (filter === "completed") {
        result = result.filter((r) => r.doc_status === "completed");
      } else {
        result = result.filter((r) => r.urgency === filter && r.doc_status !== "completed");
      }
    }
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.school_student_id ?? "").toLowerCase().includes(q) ||
          (r.passport_number ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q) ||
          (r.phone ?? "").includes(q)
      );
    }
    return result;
  }, [rows, filter, search]);

  const counts = useMemo(() => ({
    all: rows.length,
    upcoming: rows.filter((r) => r.urgency === "upcoming" && r.doc_status !== "completed").length,
    need_to_prepare: rows.filter((r) => r.urgency === "need_to_prepare" && r.doc_status !== "completed").length,
    urgent: rows.filter((r) => r.urgency === "urgent" && r.doc_status !== "completed").length,
    overdue: rows.filter((r) => r.urgency === "overdue" && r.doc_status !== "completed").length,
    completed: rows.filter((r) => r.doc_status === "completed").length,
  }), [rows]);

  function exportCSV(data: Row[]) {
    const headers = [
      "Student Name", "Student ID", "Nationality", "Passport No.",
      "Email", "Phone", "Course / Level", "Visa Last Date",
      "Days Remaining", "Document Status", "Completed Date", "Action Status",
    ];
    const escape = (v: string | number | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = [
      headers.join(","),
      ...data.map((r) => [
        escape(r.name),
        escape(r.school_student_id),
        escape(r.nationality),
        escape(r.passport_number),
        escape(r.email),
        escape(r.phone),
        escape(r.course),
        formatDate(r.visa_last_date),
        r.daysRemaining <= 0 ? "Overdue" : r.daysRemaining,
        URGENCY_LABEL[r.urgency],
        r.completed_at ? formatDate(r.completed_at) : "",
        escape(r.doc_status),
      ].join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document_notifications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const FILTERS: { value: FilterStatus; label: string; color: string }[] = [
    { value: "all", label: "All", color: "bg-slate-500/20 text-slate-300 hover:bg-slate-500/30" },
    { value: "upcoming", label: "Upcoming", color: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" },
    { value: "need_to_prepare", label: "Need to Prepare", color: "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30" },
    { value: "urgent", label: "Urgent", color: "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30" },
    { value: "overdue", label: "Overdue", color: "bg-red-500/20 text-red-300 hover:bg-red-500/30" },
    { value: "completed", label: "Completed", color: "bg-green-500/20 text-green-300 hover:bg-green-500/30" },
  ];

  return (
    <main className="px-6 py-12">
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
        <CardHeader className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Bell size={24} className="text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">
                Document Submit Notification
              </CardTitle>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Students with visa last date within {DAYS_THRESHOLD} days, plus full completed case history
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filter === f.value
                    ? f.color + " border-current ring-1 ring-current"
                    : f.color + " border-transparent opacity-60"
                }`}
              >
                {f.label}
                <span className="ml-1.5 opacity-70">
                  {counts[f.value as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Export */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, student ID, passport, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <Button
              onClick={() => exportCSV(filtered)}
              className="h-9 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0"
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-16">
              No document notifications within {DAYS_THRESHOLD} days.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-16">
              No results found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
              <table className="w-full table-auto border-collapse text-sm" style={{ minWidth: "1300px" }}>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {[
                      "Student Name", "Student ID", "Nationality", "Passport No.",
                      "Email", "Phone", "Course / Level", "Visa Last Date",
                      "Days Remaining", "Document Status", "Completed Date", "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="h-11 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap bg-slate-50 dark:bg-slate-800/80 align-middle"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={`${row.source}-${row.id}`}
                      className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {row.school_student_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.nationality ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {row.passport_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {row.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {row.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize whitespace-nowrap">
                        {row.course ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(row.visa_last_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.doc_status === "completed" ? (
                          <span className="text-slate-400 font-semibold text-xs">-</span>
                        ) : row.daysRemaining <= 0 ? (
                          <span className="text-red-400 font-semibold text-xs">Overdue</span>
                        ) : (
                          <span className={`font-semibold text-xs ${row.daysRemaining <= 14 ? "text-orange-400" : row.daysRemaining <= 30 ? "text-yellow-400" : "text-blue-400"}`}>
                            {row.daysRemaining}d
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.doc_status === "completed" ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_BADGE.completed}`}>
                            Completed
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${URGENCY_BADGE[row.urgency]}`}>
                            {URGENCY_LABEL[row.urgency]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {row.completed_at ? formatDate(row.completed_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_BADGE[row.doc_status]}`}>
                            {row.doc_status.charAt(0).toUpperCase() + row.doc_status.slice(1)}
                          </span>
                          <Select
                            value={row.doc_status}
                            onValueChange={(val) => handleDocStatusChange(row, val as DocStatus)}
                            disabled={updatingId === row.id}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="checked">Checked</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              Showing {filtered.length} of {rows.length} case{rows.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
