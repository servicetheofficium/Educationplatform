"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Users, FileText, XCircle, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStudents, getApplications, updateApplication, updateStudent, deleteApplication } from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { StudentWithProfile, Application } from "@/lib/types";

const STUDENTS_PER_PAGE = 5;

const STATUS_STYLES: Record<Application["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-0",
  approved: "bg-green-500/20 text-green-300 border-0",
  rejected: "bg-red-500/20 text-red-300 border-0",
  contacted: "bg-blue-500/20 text-blue-300 border-0",
  cancelled: "bg-slate-500/20 text-slate-300 border-0",
};

function PaginationBar({
  page,
  totalPages,
  total,
  perPage,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
          disabled={page === 1}
          onClick={onPrev}
        >
          <ChevronLeft size={16} />
          Prev
        </Button>
        <span className="text-sm text-slate-500 dark:text-slate-400 px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
          disabled={page === totalPages}
          onClick={onNext}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Tab = "enrolled" | "applications";

export function StudentsPanel({
  onBack,
  onEnrollmentChange,
  initialStudents,
  initialApplications,
}: {
  onBack?: () => void;
  onEnrollmentChange?: (delta: number) => void;
  initialStudents?: StudentWithProfile[];
  initialApplications?: Application[];
}) {
  const hasInitial = initialStudents !== undefined;
  const [tab, setTab] = useState<Tab>("enrolled");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentWithProfile[]>(initialStudents ?? []);
  const [applications, setApplications] = useState<Application[]>(initialApplications ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [enrolledPage, setEnrolledPage] = useState(1);
  const [appsPage, setAppsPage] = useState(1);

  useEffect(() => {
    if (hasInitial) return;
    Promise.all([getStudents(), getApplications()]).then(([s, a]) => {
      if (s.success) setStudents(s.data as StudentWithProfile[]);
      if (a.success) setApplications(a.data as Application[]);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from("students").select("*, profiles(email, full_name), student_courses(status, created_at, courses(name, language, level))").is("cancelled_at", null).order("created_at", { ascending: false }),
      supabase.from("applications").select("*, courses(name)").order("created_at", { ascending: false }),
    ]);
    if (s) setStudents(s as StudentWithProfile[]);
    if (a) setApplications(a as Application[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-students-panel-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, refreshData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  async function handleStatusChange(id: string, status: Application["status"]) {
    const prev = applications.find((a) => a.id === id)?.status;
    setUpdatingId(id);
    const res = await updateApplication(id, { status });
    if (res.success) {
      setApplications((apps) =>
        apps.map((a) => (a.id === id ? { ...a, status } : a))
      );
      if (status === "approved" && prev !== "approved") {
        onEnrollmentChange?.(1);
        setTab("enrolled");
        await refreshData();
      } else if (prev === "approved" && status !== "approved") {
        onEnrollmentChange?.(-1);
      }
    }
    setUpdatingId(null);
  }

  async function handleDeleteApplication(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setUpdatingId(id);
    const res = await deleteApplication(id);
    if (res.success) {
      setApplications((apps) => apps.filter((a) => a.id !== id));
    }
    setUpdatingId(null);
  }

  async function handleCancelStudent(id: string) {
    setUpdatingId(id);
    const res = await updateStudent(id, { cancelled_at: new Date().toISOString() });
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      onEnrollmentChange?.(-1);
    }
    setUpdatingId(null);
  }

  const q = search.toLowerCase();

  const matchApp = (a: Application) =>
    !q ||
    a.name.toLowerCase().includes(q) ||
    a.email.toLowerCase().includes(q) ||
    (a.phone ?? "").includes(q) ||
    (a.courses?.name ?? "").toLowerCase().includes(q) ||
    a.status.toLowerCase().includes(q);

  const matchStudent = (s: StudentWithProfile) =>
    !q ||
    (s.profiles?.full_name ?? s.name ?? "").toLowerCase().includes(q) ||
    (s.profiles?.email ?? s.email ?? "").toLowerCase().includes(q) ||
    (s.phone ?? "").includes(q);

  const pendingApps = applications.filter(
    (a) => a.status !== "approved" && a.status !== "cancelled"
  );
  const enrolledRows = students.filter(matchStudent);
  const STATUS_ORDER: Application["status"][] = ["pending", "contacted", "approved", "rejected"];
  const allNonCancelledApps = applications.filter((a) => a.status !== "cancelled");
  const filteredPending = (q ? allNonCancelledApps : pendingApps)
    .filter(matchApp)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const enrolledTotalPages = Math.max(1, Math.ceil(enrolledRows.length / STUDENTS_PER_PAGE));

  const pagedEnrolled = enrolledRows.slice(
    (enrolledPage - 1) * STUDENTS_PER_PAGE, enrolledPage * STUDENTS_PER_PAGE
  );


  return (
    <div className="min-w-0 overflow-hidden">
      <main className="px-6 py-12">
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users size={24} className="text-green-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-900 dark:text-white">
                  Manage Students
                </CardTitle>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Enrolled students and incoming applications
                </p>
              </div>
            </div>

            <div className="relative mt-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, phone, course..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setEnrolledPage(1); setAppsPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              className="w-full"
            >
              <TabsList
                variant="line"
                className="w-full justify-start h-auto pb-0 border-b border-slate-200 dark:border-slate-700 rounded-none gap-0 [&>[data-slot=tabs-trigger]]:text-slate-500 dark:[&>[data-slot=tabs-trigger]]:text-slate-400 [&>[data-slot=tabs-trigger][data-active]]:text-slate-900 dark:[&>[data-slot=tabs-trigger][data-active]]:text-white [&>[data-slot=tabs-trigger]]:after:bg-green-500 [&>[data-slot=tabs-trigger]]:px-5 [&>[data-slot=tabs-trigger]]:py-3"
              >
                <TabsTrigger value="enrolled">
                  <Users size={15} />
                  Enrolled Students
                  {!loading && (
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 text-xs">
                      {students.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="applications">
                  <FileText size={15} />
                  Applications
                  {!loading && (
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 text-xs">
                      {pendingApps.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tab === "enrolled" ? (
              students.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-16">
                  No enrolled students yet.
                </p>
              ) : (
                <>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Course / Level</TableHead>
                      <TableHead>Enrolled Since</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedEnrolled.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-slate-900 dark:text-white">{s.profiles?.full_name ?? s.name ?? "—"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{s.profiles?.email ?? s.email ?? "—"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{s.phone ?? "—"}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 text-blue-300 border-0">
                            {s.student_courses?.[0]?.courses
                              ? s.student_courses[0].courses.name
                              : <span className="capitalize">{s.language_level}</span>}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(s.enrollment_date)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={updatingId === s.id}
                            onClick={() => handleCancelStudent(s.id)}
                            className="text-red-400 hover:text-red-300 h-auto p-0 flex items-center gap-1 text-xs"
                          >
                            <XCircle size={13} />
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {enrolledRows.length > STUDENTS_PER_PAGE && (
                  <PaginationBar
                    page={enrolledPage}
                    totalPages={enrolledTotalPages}
                    total={enrolledRows.length}
                    perPage={STUDENTS_PER_PAGE}
                    onPrev={() => setEnrolledPage((p) => p - 1)}
                    onNext={() => setEnrolledPage((p) => p + 1)}
                  />
                )}
                </>
              )
            ) : tab === "applications" ? (
              filteredPending.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-16">
                  No applications yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((app, i) => {
                      const prevStatus = i > 0 ? filteredPending[i - 1].status : null;
                      const isNewGroup = !!q && app.status !== prevStatus;
                      return (
                        <React.Fragment key={app.id}>
                          {isNewGroup && (
                            <TableRow className="bg-slate-100/60 dark:bg-slate-700/40">
                              <TableCell colSpan={7} className="py-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${app.status === "pending" ? "bg-yellow-400" : app.status === "contacted" ? "bg-blue-400" : app.status === "approved" ? "bg-green-400" : "bg-red-400"}`} />
                                  {app.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium text-slate-900 dark:text-white">
                              {app.name}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300">
                              {app.email}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300">
                              {app.phone ?? "—"}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300">
                              {app.courses?.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 max-w-xs truncate">
                              {app.message ?? "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge className={STATUS_STYLES[app.status] + " capitalize"}>
                                  {app.status}
                                </Badge>
                                <Select
                                  value={app.status}
                                  onValueChange={(val) =>
                                    handleStatusChange(app.id, (val ?? app.status) as Application["status"])
                                  }
                                  disabled={updatingId === app.id}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updatingId === app.id}
                                onClick={() => handleDeleteApplication(app.id)}
                                className="text-red-400 hover:text-red-300 h-auto p-0 flex items-center gap-1 text-xs"
                              >
                                <Trash2 size={13} />
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
