"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Users, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const STATUS_STYLES: Record<Application["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-0",
  approved: "bg-green-500/20 text-green-300 border-0",
  rejected: "bg-red-500/20 text-red-300 border-0",
  contacted: "bg-blue-500/20 text-blue-300 border-0",
  cancelled: "bg-slate-500/20 text-slate-300 border-0",
};

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
}: {
  onBack: () => void;
  onEnrollmentChange?: (delta: number) => void;
}) {
  const [tab, setTab] = useState<Tab>("enrolled");
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStudents(), getApplications()]).then(([s, a]) => {
      if (s.success) setStudents(s.data as StudentWithProfile[]);
      if (a.success) setApplications(a.data as Application[]);
      setLoading(false);
    });
  }, []);

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

  const approvedApps = applications.filter((a) => a.status === "approved");
  const pendingApps = applications.filter(
    (a) => a.status !== "approved" && a.status !== "cancelled"
  );
  const cancelledApps = applications.filter((a) => a.status === "cancelled");

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode, count: number) => (
    <button
      onClick={() => setTab(id)}
      className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
        tab === id
          ? "border-green-500 text-white"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}{" "}
        {!loading && (
          <span className="bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 text-xs">
            {count}
          </span>
        )}
      </span>
    </button>
  );

  return (
    <div>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-400 hover:text-white mb-8 -ml-2"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to Dashboard
        </Button>

        <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users size={24} className="text-green-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Manage Students
                </CardTitle>
                <p className="text-slate-400 text-sm">
                  Enrolled students and incoming applications
                </p>
              </div>
            </div>

            <div className="flex border-b border-slate-700">
              {tabBtn("enrolled", "Enrolled Students", <Users size={15} />, students.length + approvedApps.length)}
              {tabBtn("applications", "Applications", <FileText size={15} />, pendingApps.length)}
              {tabBtn("cancelled", "Cancelled", <XCircle size={15} />, cancelledApps.length)}
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tab === "enrolled" ? (
              students.length === 0 && approvedApps.length === 0 ? (
                <p className="text-center text-slate-400 py-16">
                  No enrolled students yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Full Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Phone</TableHead>
                      <TableHead className="text-slate-300">Course / Level</TableHead>
                      <TableHead className="text-slate-300">Enrolled Since</TableHead>
                      <TableHead className="text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow
                        key={s.id}
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <TableCell className="font-medium text-white">
                          {s.profiles?.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {s.profiles?.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {s.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 text-blue-300 border-0 capitalize">
                            {s.language_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDate(s.enrollment_date)}
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-500 text-xs">—</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {approvedApps.map((app) => (
                      <TableRow
                        key={app.id}
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <TableCell className="font-medium text-white">
                          {app.name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {app.email}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {app.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {app.courses?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDate(app.updated_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={updatingId === app.id}
                            onClick={() => handleStatusChange(app.id, "cancelled")}
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
              )
            ) : tab === "applications" ? (
              pendingApps.length === 0 ? (
                <p className="text-center text-slate-400 py-16">
                  No applications yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Phone</TableHead>
                      <TableHead className="text-slate-300">Course</TableHead>
                      <TableHead className="text-slate-300">Message</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApps.map((app) => (
                      <TableRow
                        key={app.id}
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <TableCell className="font-medium text-white">
                          {app.name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {app.email}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {app.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {app.courses?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-400 max-w-xs truncate">
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
                              <SelectTrigger className="h-7 w-28 text-xs bg-slate-700/50 border-slate-600 text-slate-300">
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
              )
            ) : cancelledApps.length === 0 ? (
              <p className="text-center text-slate-400 py-16">
                No cancelled students.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Phone</TableHead>
                    <TableHead className="text-slate-300">Course</TableHead>
                    <TableHead className="text-slate-300">Cancelled On</TableHead>
                    <TableHead className="text-slate-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelledApps.map((app) => (
                    <TableRow
                      key={app.id}
                      className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <TableCell className="font-medium text-white">
                        {app.name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {app.email}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {app.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {app.courses?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
