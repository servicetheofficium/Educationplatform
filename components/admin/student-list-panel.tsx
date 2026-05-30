"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users, Pencil, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getStudents, getApplications, getCourses, createApplication, updateApplication, updateStudent, deleteStudent, deleteApplication } from "@/lib/crud";
import type { StudentWithProfile, Application, Course, VisaStatus } from "@/lib/types";

const PER_PAGE = 10;

const VISA_LABELS: Record<VisaStatus, string> = {
  processing:       "Processing",
  visa_changed:     "Visa Changed",
  first_extension:  "1st Extension",
  second_extension: "2nd Extension",
  third_extension:  "3rd Extension",
};


function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type RowSource = "student" | "application";

type Row = {
  id: string;
  source: RowSource;
  num: number;
  name: string;
  nationality: string | null;
  passport_number: string | null;
  phone: string | null;
  duration_months: number | null;
  course_level: string | null;
  enrolled_date: string;
  visa_status: VisaStatus | null;
  visa_change_date: string | null;
  visa_last_date: string | null;
};

type EditForm = {
  nationality: string;
  passport_number: string;
  phone: string;
  duration_months: string;
  visa_status: VisaStatus | "";
  visa_change_date: string;
  visa_last_date: string;
};

function buildRows(students: StudentWithProfile[], applications: Application[]): Row[] {
  const approvedApps = applications.filter((a) => a.status === "approved");
  return [
    ...students.map((s) => ({
      id: s.id,
      source: "student" as RowSource,
      name: s.profiles?.full_name ?? "—",
      nationality: s.nationality ?? null,
      passport_number: s.passport_number ?? null,
      phone: s.phone ?? null,
      duration_months: s.duration_months ?? null,
      course_level: s.language_level ?? null,
      enrolled_date: s.enrollment_date,
      visa_status: s.visa_status ?? null,
      visa_change_date: s.visa_change_date ?? null,
      visa_last_date: s.visa_last_date ?? null,
    })),
    ...approvedApps.map((a) => ({
      id: a.id,
      source: "application" as RowSource,
      name: a.name,
      nationality: a.nationality ?? null,
      passport_number: a.passport_number ?? null,
      phone: a.phone ?? null,
      duration_months: a.duration_months ?? null,
      course_level: a.courses?.name ?? null,
      enrolled_date: a.updated_at,
      visa_status: a.visa_status ?? null,
      visa_change_date: a.visa_change_date ?? null,
      visa_last_date: a.visa_last_date ?? null,
    })),
  ].sort((a, b) => new Date(a.enrolled_date).getTime() - new Date(b.enrolled_date).getTime())
   .map((r, i) => ({ ...r, num: i + 1 }));
}

export function StudentListPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nationality: "", passport_number: "", phone: "", duration_months: "", visa_status: "", visa_change_date: "", visa_last_date: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deletingRow, setDeletingRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [addForm, setAddForm] = useState({
    name: "", email: "", phone: "", nationality: "", passport_number: "",
    course_id: "", duration_months: "", visa_status: "" as VisaStatus | "",
    visa_change_date: "", visa_last_date: "",
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [s, a, c] = await Promise.all([getStudents(), getApplications(), getCourses()]);
    const students = s.success ? (s.data as StudentWithProfile[]) : [];
    const apps = a.success ? (a.data as Application[]) : [];
    if (c.success) setCourses(c.data as Course[]);
    setRows(buildRows(students, apps));
    setLoading(false);
  }

  function openAdd() {
    setAddError(null);
    setAddForm({ name: "", email: "", phone: "", nationality: "", passport_number: "", course_id: "", duration_months: "", visa_status: "", visa_change_date: "", visa_last_date: "" });
    setAddOpen(true);
  }

  async function handleAdd() {
    if (!addForm.name || !addForm.email) { setAddError("Name and email are required."); return; }
    setAdding(true);
    setAddError(null);
    const res = await createApplication({
      name: addForm.name,
      email: addForm.email,
      phone: addForm.phone || undefined,
      course_id: addForm.course_id || undefined,
      message: "",
    });
    if (!res.success) {
      setAddError((res as { error?: string }).error ?? "Failed to create student.");
      setAdding(false);
      return;
    }
    // fetch fresh to get the new id, then immediately approve + set extra fields
    const freshApps = await getApplications();
    if (freshApps.success) {
      const apps = freshApps.data as Application[];
      const newest = apps.find((a) => a.email === addForm.email && a.status === "pending");
      if (newest) {
        await updateApplication(newest.id, {
          status: "approved",
          nationality: addForm.nationality || undefined,
          passport_number: addForm.passport_number || undefined,
          duration_months: addForm.duration_months ? Number(addForm.duration_months) : undefined,
          visa_status: (addForm.visa_status || undefined) as VisaStatus | undefined,
          visa_change_date: addForm.visa_change_date || undefined,
          visa_last_date: addForm.visa_last_date || undefined,
        });
      }
    }
    await load();
    setAddOpen(false);
    setAdding(false);
  }

  function openEdit(row: Row) {
    setSaveError(null);
    setEditingRow(row);
    setEditForm({
      nationality: row.nationality ?? "",
      passport_number: row.passport_number ?? "",
      phone: row.phone ?? "",
      duration_months: row.duration_months ? String(row.duration_months) : "",
      visa_status: row.visa_status ?? "",
      visa_change_date: row.visa_change_date ?? "",
      visa_last_date: row.visa_last_date ?? "",
    });
  }

  async function handleSave() {
    if (!editingRow) return;
    setSaving(true);
    setSaveError(null);
    const payload = {
      nationality: editForm.nationality || undefined,
      passport_number: editForm.passport_number || undefined,
      phone: editForm.phone || undefined,
      duration_months: editForm.duration_months ? Number(editForm.duration_months) : undefined,
      visa_status: (editForm.visa_status || undefined) as VisaStatus | undefined,
      visa_change_date: editForm.visa_change_date || undefined,
      visa_last_date: editForm.visa_last_date || undefined,
    };
    const res = editingRow.source === "student"
      ? await updateStudent(editingRow.id, payload)
      : await updateApplication(editingRow.id, payload);
    if (res.success) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, nationality: payload.nationality ?? null, passport_number: payload.passport_number ?? null, phone: payload.phone ?? null, duration_months: payload.duration_months ?? null, visa_status: payload.visa_status ?? null, visa_change_date: payload.visa_change_date ?? null, visa_last_date: payload.visa_last_date ?? null }
            : r
        )
      );
      setEditingRow(null);
    } else {
      setSaveError(res.error ?? "Failed to save. Check database policies.");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deletingRow) return;
    setDeleting(true);
    const res = deletingRow.source === "student"
      ? await deleteStudent(deletingRow.id)
      : await deleteApplication(deletingRow.id);
    if (res.success) {
      setRows((prev) => prev.filter((r) => r.id !== deletingRow.id).map((r, i) => ({ ...r, num: i + 1 })));
      setDeletingRow(null);
    }
    setDeleting(false);
  }

  const q = search.toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.nationality ?? "").toLowerCase().includes(q) ||
        (r.passport_number ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").includes(q)
      )
    : rows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <main className="px-6 py-12">
      <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
        <CardHeader className="p-8 pb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users size={24} className="text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Student List</CardTitle>
                <p className="text-slate-400 text-sm">All enrolled students</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={openAdd} className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2">
              <Plus size={16} /> Add Student
            </Button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, nationality, passport, phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-slate-400 py-16">No enrolled students yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 w-10">#</TableHead>
                      <TableHead className="text-slate-300">Student Name</TableHead>
                      <TableHead className="text-slate-300">Nationality</TableHead>
                      <TableHead className="text-slate-300">Passport No.</TableHead>
                      <TableHead className="text-slate-300">Phone</TableHead>
                      <TableHead className="text-slate-300">Duration</TableHead>
                      <TableHead className="text-slate-300">Course / Level</TableHead>
                      <TableHead className="text-slate-300">Visa Change Date</TableHead>
                      <TableHead className="text-slate-300">Visa Last Date</TableHead>
                      <TableHead className="text-slate-300">Visa Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((row) => (
                      <TableRow key={row.id} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                        <TableCell className="text-slate-500 text-xs">{row.num}</TableCell>
                        <TableCell className="font-medium text-white">
                          <Popover>
                            <PopoverTrigger className="text-white font-medium hover:text-blue-400 hover:underline transition-colors text-left">
                              {row.name}
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0 bg-slate-800 border-slate-700 text-slate-200" side="right" align="start">
                              <div className="px-4 py-3 border-b border-slate-700">
                                <p className="font-semibold text-white text-sm">{row.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5 capitalize">{row.source === "student" ? "Registered Student" : "Enrolled via Application"}</p>
                              </div>
                              <div className="px-4 py-3 space-y-2 text-sm">
                                {[
                                  ["Nationality",       row.nationality],
                                  ["Passport No.",      row.passport_number],
                                  ["Phone",             row.phone],
                                  ["Duration",          row.duration_months ? `${row.duration_months} months` : null],
                                  ["Course / Level",    row.course_level],
                                  ["Enrolled Date",     formatDate(row.enrolled_date)],
                                  ["Visa Change Date",  row.visa_change_date ? formatDate(row.visa_change_date) : null],
                                  ["Visa Last Date",    row.visa_last_date ? formatDate(row.visa_last_date) : null],
                                  ["Visa Status",       row.visa_status ? VISA_LABELS[row.visa_status] : null],
                                ].map(([label, value]) => (
                                  <div key={label} className="flex justify-between gap-4">
                                    <span className="text-slate-400 shrink-0">{label}</span>
                                    <span className="text-slate-200 text-right">{value ?? "—"}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-slate-300">{row.nationality ?? "—"}</TableCell>
                        <TableCell className="text-slate-300 font-mono text-xs">{row.passport_number ?? "—"}</TableCell>
                        <TableCell className="text-slate-300">{row.phone ?? "—"}</TableCell>
                        <TableCell className="text-slate-300">{row.duration_months ? `${row.duration_months} mo.` : "—"}</TableCell>
                        <TableCell className="text-slate-300 capitalize">{row.course_level ?? "—"}</TableCell>
                        <TableCell className="text-slate-300">{row.visa_change_date ? formatDate(row.visa_change_date) : "—"}</TableCell>
                        <TableCell className="text-slate-300">{row.visa_last_date ? formatDate(row.visa_last_date) : "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={row.visa_status ?? ""}
                            onValueChange={async (val) => {
                              const status = val as VisaStatus;
                              const res = row.source === "student"
                                ? await updateStudent(row.id, { visa_status: status })
                                : await updateApplication(row.id, { visa_status: status });
                              if (res.success) {
                                setRows((prev) =>
                                  prev.map((r) => r.id === row.id ? { ...r, visa_status: status } : r)
                                );
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-36 text-xs bg-slate-700/50 border-slate-600 text-slate-300">
                              <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(VISA_LABELS) as [VisaStatus, string][]).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 h-auto p-0 flex items-center gap-1 text-xs"
                              onClick={() => openEdit(row)}
                            >
                              <Pencil size={13} /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 h-auto p-0 flex items-center gap-1 text-xs"
                              onClick={() => setDeletingRow(row)}
                            >
                              <Trash2 size={13} /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white disabled:opacity-30" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={16} /> Prev
                  </Button>
                  <span className="text-sm text-slate-400 px-2">{page} / {totalPages}</span>
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white disabled:opacity-30" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRow} onOpenChange={(o) => !o && setEditingRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student — {editingRow?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nationality</label>
                <Input placeholder="e.g. Japanese" value={editForm.nationality} onChange={(e) => setEditForm((f) => ({ ...f, nationality: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Passport No.</label>
                <Input placeholder="e.g. AB123456" value={editForm.passport_number} onChange={(e) => setEditForm((f) => ({ ...f, passport_number: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <Input placeholder="e.g. 0812345678" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (months)</label>
                <Input type="number" min={1} placeholder="e.g. 12" value={editForm.duration_months} onChange={(e) => setEditForm((f) => ({ ...f, duration_months: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Status</label>
              <Select value={editForm.visa_status} onValueChange={(v) => setEditForm((f) => ({ ...f, visa_status: v as VisaStatus }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(VISA_LABELS) as [VisaStatus, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visa Change Date</label>
                <Input type="date" value={editForm.visa_change_date} onChange={(e) => setEditForm((f) => ({ ...f, visa_change_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visa Last Date</label>
                <Input type="date" value={editForm.visa_last_date} onChange={(e) => setEditForm((f) => ({ ...f, visa_last_date: e.target.value }))} />
              </div>
            </div>
          </div>
          {saveError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
          )}
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingRow} onOpenChange={(o) => !o && setDeletingRow(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-semibold text-foreground">{deletingRow?.name}</span> from the student list? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Student Dialog ── */}
      <Dialog open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name *</label>
                <Input placeholder="e.g. John Smith" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" placeholder="e.g. john@email.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <Input placeholder="e.g. 0812345678" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nationality</label>
                <Input placeholder="e.g. Japanese" value={addForm.nationality} onChange={(e) => setAddForm((f) => ({ ...f, nationality: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Passport No.</label>
                <Input placeholder="e.g. AB123456" value={addForm.passport_number} onChange={(e) => setAddForm((f) => ({ ...f, passport_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (months)</label>
                <Input type="number" min={1} placeholder="e.g. 12" value={addForm.duration_months} onChange={(e) => setAddForm((f) => ({ ...f, duration_months: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Course</label>
              <Select value={addForm.course_id} onValueChange={(v) => setAddForm({ ...addForm, course_id: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Visa Status</label>
              <Select value={addForm.visa_status} onValueChange={(v) => setAddForm((f) => ({ ...f, visa_status: v as VisaStatus }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(VISA_LABELS) as [VisaStatus, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visa Change Date</label>
                <Input type="date" value={addForm.visa_change_date} onChange={(e) => setAddForm((f) => ({ ...f, visa_change_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Visa Last Date</label>
                <Input type="date" value={addForm.visa_last_date} onChange={(e) => setAddForm((f) => ({ ...f, visa_last_date: e.target.value }))} />
              </div>
            </div>
          </div>
          {addError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{addError}</p>
          )}
          <DialogFooter>
            <Button onClick={handleAdd} disabled={adding || !addForm.name || !addForm.email} className="bg-brand-600 hover:bg-brand-700">
              {adding ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
