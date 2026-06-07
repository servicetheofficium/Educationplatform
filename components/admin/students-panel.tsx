"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users, FileText, XCircle, Search } from "lucide-react";
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
import { getStudents, getApplications, updateApplication } from "@/lib/crud";
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

type Tab = "enrolled" | "applications" | "cancelled";

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
  const [cancelledPage, setCancelledPage] = useState(1);

  useEffect(() => {
    if (hasInitial) return;
    Promise.all([getStudents(), getApplications()]).then(([s, a]) => {
      if (s.success) setStudents(s.data as StudentWithProfile[]);
      if (a.success) setApplications(a.data as Application[]);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      } else if (prev === "approved" && status !== "approved") {
        onEnrollmentChange?.(-1);
        if (status === "cancelled") setTab("cancelled");
      }
    }
    setUpdatingId(null);
  }

  const q = search.toLowerCase();

  const matchApp = (a: Application) =>
    !q ||
    a.name.toLowerCase().includes(q) ||
    a.email.toLowerCase().includes(q) ||
    (a.phone ?? "").includes(q) ||
    (a.courses?.name ?? "").toLowerCase().includes(q);

  const matchStudent = (s: StudentWithProfile) =>
    !q ||
    (s.profiles?.full_name ?? "").toLowerCase().includes(q) ||
    (s.profiles?.email ?? "").toLowerCase().includes(q) ||
    (s.phone ?? "").includes(q);

  const approvedApps = applications.filter((a) => a.status === "approved");
  const pendingApps = applications.filter(
    (a) => a.status !== "approved" && a.status !== "cancelled"
  );
  const cancelledApps = applications.filter((a) => a.status === "cancelled");

  type EnrolledRow =
    | { kind: "student"; data: StudentWithProfile }
    | { kind: "approved"; data: Application };
  const enrolledRows: EnrolledRow[] = [
    ...students.filter(matchStudent).map((s) => ({ kind: "student" as const, data: s })),
    ...approvedApps.filter(matchApp).map((a) => ({ kind: "approved" as const, data: a })),
  ];
  const filteredPending = pendingApps.filter(matchApp);
  const filteredCancelled = cancelledApps.filter(matchApp);

  const enrolledTotalPages = Math.max(1, Math.ceil(enrolledRows.length / STUDENTS_PER_PAGE));
  const appsTotalPages = Math.max(1, Math.ceil(filteredPending.length / STUDENTS_PER_PAGE));
  const cancelledTotalPages = Math.max(1, Math.ceil(filteredCancelled.length / STUDENTS_PER_PAGE));

  const pagedEnrolled = enrolledRows.slice(
    (enrolledPage - 1) * STUDENTS_PER_PAGE, enrolledPage * STUDENTS_PER_PAGE
  );
  const pagedApps = filteredPending.slice(
    (appsPage - 1) * STUDENTS_PER_PAGE, appsPage * STUDENTS_PER_PAGE
  );
  const pagedCancelled = filteredCancelled.slice(
    (cancelledPage - 1) * STUDENTS_PER_PAGE, cancelledPage * STUDENTS_PER_PAGE
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
                onChange={(e) => { setSearch(e.target.value); setEnrolledPage(1); setAppsPage(1); setCancelledPage(1); }}
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
                      {students.length + approvedApps.length}
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
                <TabsTrigger value="cancelled">
                  <XCircle size={15} />
                  Cancelled
                  {!loading && (
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 text-xs">
                      {cancelledApps.length}
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
              students.length === 0 && approvedApps.length === 0 ? (
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
                    {pagedEnrolled.map((row) =>
                      row.kind === "student" ? (
                        <TableRow key={row.data.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-white">{row.data.profiles?.full_name ?? "—"}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{row.data.profiles?.email ?? "—"}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{row.data.phone ?? "—"}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-500/20 text-blue-300 border-0 capitalize">{row.data.language_level}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(row.data.enrollment_date)}</TableCell>
                          <TableCell><span className="text-slate-400 dark:text-slate-500 text-xs">—</span></TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={row.data.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-white">{row.data.name}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{row.data.email}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{row.data.phone ?? "—"}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{row.data.courses?.name ?? "—"}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(row.data.updated_at)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingId === row.data.id}
                              onClick={() => handleStatusChange(row.data.id, "cancelled")}
                              className="text-red-400 hover:text-red-300 h-auto p-0 flex items-center gap-1 text-xs"
                            >
                              <XCircle size={13} />
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
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
              pendingApps.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-16">
                  No applications yet.
                </p>
              ) : (
                <>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedApps.map((app) => (
                      <TableRow key={app.id}>
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
                                handleStatusChange(
                                  app.id,
                                  (val ?? app.status) as Application["status"]
                                )
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {pendingApps.length > STUDENTS_PER_PAGE && (
                  <PaginationBar
                    page={appsPage}
                    totalPages={appsTotalPages}
                    total={pendingApps.length}
                    perPage={STUDENTS_PER_PAGE}
                    onPrev={() => setAppsPage((p) => p - 1)}
                    onNext={() => setAppsPage((p) => p + 1)}
                  />
                )}
                </>
              )
            ) : cancelledApps.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-16">
                No cancelled students.
              </p>
            ) : (
              <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Cancelled On</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedCancelled.map((app) => (
                    <TableRow key={app.id}>
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
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {formatDate(app.updated_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingId === app.id}
                          onClick={() => handleStatusChange(app.id, "approved")}
                          className="text-green-400 hover:text-green-300 h-auto p-0 flex items-center gap-1 text-xs"
                        >
                          Re-enroll
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              {cancelledApps.length > STUDENTS_PER_PAGE && (
                <PaginationBar
                  page={cancelledPage}
                  totalPages={cancelledTotalPages}
                  total={cancelledApps.length}
                  perPage={STUDENTS_PER_PAGE}
                  onPrev={() => setCancelledPage((p) => p - 1)}
                  onNext={() => setCancelledPage((p) => p + 1)}
                />
              )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
