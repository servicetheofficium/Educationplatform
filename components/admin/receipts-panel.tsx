"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, Printer, Trash2, Pencil, Search, X, ChevronLeft, ChevronRight, Receipt as ReceiptIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { createReceipt, updateReceipt, deleteReceipt } from "@/lib/crud";
import type { Receipt, ReceiptItem, StudentWithProfile, Course, DocumentService } from "@/lib/types";
import { motion } from "motion/react";

const PER_PAGE = 10;

function receiptDateStr(createdAt: string) {
  const d = new Date(createdAt);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${mon}/${yr} ${hh}:${mm}`;
}

function generateReceiptNo(existing: Receipt[]): string {
  const nums = existing
    .map((r) => r.receipt_no)
    .filter((n) => /^R-\d+$/.test(n))
    .map((n) => parseInt(n.replace("R-", ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `R-${String(next).padStart(6, "0")}`;
}

// ─── form type ───────────────────────────────────────────────────────────────

type ReceiptForm = {
  student_name: string;
  phone: string;
  email: string;
  passport_no: string;
  duration: string;
  items: ReceiptItem[];
  paid_amount: number;
  payment_method: string;
  staff_name: string;
};

const EMPTY_FORM: ReceiptForm = {
  student_name: "",
  phone: "",
  email: "",
  passport_no: "",
  duration: "",
  items: [],
  paid_amount: 0,
  payment_method: "Cash",
  staff_name: "",
};

// ─── panel ───────────────────────────────────────────────────────────────────

interface ReceiptsPanelProps {
  initialReceipts: Receipt[];
  initialStudents: StudentWithProfile[];
  initialCourses: Course[];
  initialServices: DocumentService[];
}

export function ReceiptsPanel({ initialReceipts, initialStudents, initialCourses, initialServices }: ReceiptsPanelProps) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState<Receipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<ReceiptForm>(EMPTY_FORM);

  const filtered = receipts.filter((r) => {
    if (!r?.receipt_no || !r?.student_name) return false;
    const q = search.toLowerCase();
    return (
      r.receipt_no.toLowerCase().includes(q) ||
      r.student_name.toLowerCase().includes(q) ||
      r.course_name.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, page, totalPages]);

  const refreshReceipts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
    if (data) setReceipts((data as Receipt[]).filter((r) => r?.receipt_no));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("receipts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, refreshReceipts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshReceipts]);

  const totalAmount = form.items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const changeAmount = (form.paid_amount || 0) - totalAmount;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingReceipt(null);
    setSaveError(null);
    setFormOpen(true);
  };

  const openEdit = (r: Receipt) => {
    setSaveError(null);
    let items: ReceiptItem[] = [];
    if (r.items && r.items.length > 0) {
      items = r.items;
    } else {
      if (r.course_fee > 0) items.push({ name: r.course_name, amount: r.course_fee });
      if (r.visa_fee > 0) items.push({ name: "Visa Fee", amount: r.visa_fee });
    }
    setForm({
      student_name: r.student_name,
      phone: r.phone ?? "",
      email: r.email ?? "",
      passport_no: r.passport_no ?? "",
      duration: r.duration ?? "",
      items,
      paid_amount: r.paid_amount,
      payment_method: r.payment_method,
      staff_name: r.staff_name ?? "",
    });
    setEditingReceipt(r);
    setFormOpen(true);
  };

  const pickStudent = (id: string | null) => {
    if (!id) return;
    const s = initialStudents.find((s) => s.id === id);
    if (!s) return;
    setForm((p) => ({
      ...p,
      student_name: s.profiles?.full_name ?? "",
      phone: s.phone ?? "",
      email: s.profiles?.email ?? "",
      passport_no: s.passport_number ?? p.passport_no,
    }));
  };

  const pickCourse = (id: string | null) => {
    if (!id) return;
    const c = initialCourses.find((c) => c.id === id);
    if (!c) return;
    setForm((p) => ({
      ...p,
      items: [...p.items, { name: c.name, amount: c.price }],
      duration: c.duration_weeks ? `${c.duration_weeks} weeks` : p.duration,
    }));
  };

  const pickService = (id: string | null) => {
    if (!id) return;
    const s = initialServices.find((s) => s.id === id);
    if (!s) return;
    setForm((p) => ({
      ...p,
      items: [...p.items, { name: s.name, amount: s.price_thb }],
    }));
  };

  const updateItem = (i: number, field: keyof ReceiptItem, value: string | number) => {
    setForm((p) => ({
      ...p,
      items: p.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));
  };

  const removeItem = (i: number) => {
    setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  };

  const addItem = () => {
    setForm((p) => ({ ...p, items: [...p.items, { name: "", amount: 0 }] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const firstItemName = form.items[0]?.name || "—";
    const payload = {
      student_name: form.student_name,
      phone: form.phone || null,
      email: form.email || null,
      passport_no: form.passport_no || null,
      duration: form.duration || null,
      course_name: firstItemName,
      course_fee: 0,
      visa_fee: 0,
      items: form.items,
      total_amount: totalAmount,
      payment_method: form.payment_method,
      paid_amount: form.paid_amount,
      change_amount: changeAmount,
      staff_name: form.staff_name || null,
    };

    if (editingReceipt) {
      const res = await updateReceipt(editingReceipt.id, payload);
      if (res.success && res.data) {
        setReceipts((prev) => prev.map((r) => r.id === editingReceipt.id ? (res.data as Receipt) : r));
        setFormOpen(false);
      } else {
        setSaveError(res.error ?? "Update failed");
      }
    } else {
      const res = await createReceipt({ ...payload, receipt_no: generateReceiptNo(receipts) });
      if (res.success && res.data) {
        setReceipts((prev) => [res.data as Receipt, ...prev]);
        setFormOpen(false);
      } else {
        setSaveError(res.error ?? "Create failed");
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingReceipt) return;
    setSaving(true);
    const res = await deleteReceipt(deletingReceipt.id);
    if (res.success) {
      setReceipts((prev) => prev.filter((r) => r.id !== deletingReceipt.id));
      setDeletingReceipt(null);
    }
    setSaving(false);
  };

  return (
    <main className="px-8 py-10 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between p-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <ReceiptIcon size={24} className="text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-900 dark:text-white">Receipts</CardTitle>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Issue and manage payment receipts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search receipts..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-56"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <Button className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2" onClick={openCreate}>
                <Plus size={16} />
                New Receipt
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {paginated.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">
                {search ? "No receipts match your search." : "No receipts yet. Create one above."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Receipt No.</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Student</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Items</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Total</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Method</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {paginated.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{r.receipt_no}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{receiptDateStr(r.created_at)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.student_name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {r.items && r.items.length > 0
                            ? r.items.length === 1
                              ? r.items[0].name
                              : `${r.items[0].name} +${r.items.length - 1}`
                            : r.course_name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">฿{r.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.payment_method}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-emerald-500 hover:text-emerald-600 h-auto p-0 flex items-center gap-1" onClick={() => window.open(`/admin/receipts/${r.id}/print`, "_blank")}>
                              <Printer size={13} /> Print
                            </Button>
                            <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 h-auto p-0 flex items-center gap-1" onClick={() => openEdit(r)}>
                              <Pencil size={13} /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-auto p-0 flex items-center gap-1" onClick={() => setDeletingReceipt(r)}>
                              <Trash2 size={13} /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > PER_PAGE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-30 flex items-center gap-1" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={16} /> Prev
                  </Button>
                  <span className="text-sm text-slate-500 px-2">{page} / {totalPages}</span>
                  <Button size="sm" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-30 flex items-center gap-1" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Create / Edit Sheet ── */}
      <Sheet open={formOpen} onOpenChange={(o) => { if (!o) { setFormOpen(false); setEditingReceipt(null); } }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>{editingReceipt ? "Edit Receipt" : "New Receipt"}</SheetTitle>
            <SheetDescription>{editingReceipt ? `Editing ${editingReceipt.receipt_no}` : "Fill in the details below."}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Student quick-fill */}
            {initialStudents.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quick-fill from Student</label>
                <Select onValueChange={pickStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student…" /></SelectTrigger>
                  <SelectContent>
                    {initialStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.profiles?.full_name ?? s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Student Name *</label>
              <Input
                placeholder="Full name"
                value={form.student_name}
                onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  placeholder="09X-XXX-XXXX"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  placeholder="student@email.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Passport No <span className="text-slate-400 text-xs">(not on receipt)</span></label>
                <Input
                  placeholder="A1234567"
                  value={form.passport_no}
                  onChange={(e) => setForm((p) => ({ ...p, passport_no: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration <span className="text-slate-400 text-xs">(not on receipt)</span></label>
                <Input
                  placeholder="e.g. 8 weeks"
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Items *</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add item
                </button>
              </div>

              {/* Quick-add from course */}
              {initialCourses.length > 0 && (
                <Select onValueChange={pickCourse}>
                  <SelectTrigger className="text-xs h-8"><SelectValue placeholder="+ Add from Course…" /></SelectTrigger>
                  <SelectContent>
                    {initialCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — ฿{c.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Quick-add from service */}
              {initialServices.length > 0 && (
                <Select onValueChange={pickService}>
                  <SelectTrigger className="text-xs h-8"><SelectValue placeholder="+ Add from Service…" /></SelectTrigger>
                  <SelectContent>
                    {initialServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — ฿{s.price_thb.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {form.items.length === 0 && (
                <p className="text-xs text-slate-400 py-1">No items yet. Use quick-add or click &quot;Add item&quot;.</p>
              )}

              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(i, "amount", Number(e.target.value))}
                    className="w-28 h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total</span>
              <span>฿{totalAmount.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Paid Amount (฿)</label>
                <Input
                  type="number"
                  value={form.paid_amount || ""}
                  onChange={(e) => setForm((p) => ({ ...p, paid_amount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={form.payment_method} onValueChange={(v) => { if (v) setForm((p) => ({ ...p, payment_method: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Change</span>
              <span className={changeAmount < 0 ? "text-red-500" : ""}>฿{changeAmount.toLocaleString()}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Staff Name</label>
              <Input
                placeholder="Admin"
                value={form.staff_name}
                onChange={(e) => setForm((p) => ({ ...p, staff_name: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t border-border space-y-2">
            {saveError && <p className="text-sm text-red-500 text-center">{saveError}</p>}
            <Button
              onClick={handleSave}
              disabled={saving || !form.student_name || form.items.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700"
              size="lg"
            >
              {saving ? "Saving…" : editingReceipt ? "Save Changes" : "Create Receipt"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deletingReceipt} onOpenChange={(o) => !o && setDeletingReceipt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Receipt</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deletingReceipt?.receipt_no}</span>? This cannot be undone.
          </p>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
}
