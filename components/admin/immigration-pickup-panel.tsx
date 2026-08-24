"use client";

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { Stamp, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Download, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getImmigrationPickups, createImmigrationPickup, updateImmigrationPickup, deleteImmigrationPickup,
  getMinistryDocuments,
} from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { ImmigrationPickup, MinistryDocument } from "@/lib/types";

const PER_PAGE = 10;

type PickupForm = {
  document_name: string;
  pickup_date: string;
  recipient_name: string;
  ministry_document_id: string | null;
};

const EMPTY_FORM: PickupForm = { document_name: "", pickup_date: "", recipient_name: "", ministry_document_id: null };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(from: string, to: string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function ImmigrationPickupPanel({ initialPickups }: { initialPickups: ImmigrationPickup[] }) {
  const [pickups, setPickups] = useState<ImmigrationPickup[]>(initialPickups);
  const [pendingDocs, setPendingDocs] = useState<MinistryDocument[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<ImmigrationPickup | null>(null);
  const [deletingPickup, setDeletingPickup] = useState<ImmigrationPickup | null>(null);
  const [form, setForm] = useState<PickupForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshPickups = useCallback(async () => {
    const res = await getImmigrationPickups();
    if (res.success) setPickups(res.data as ImmigrationPickup[]);
  }, []);

  const refreshPendingDocs = useCallback(async () => {
    const res = await getMinistryDocuments();
    if (res.success) setPendingDocs((res.data as MinistryDocument[]).filter((d) => !d.picked_up_at));
  }, []);

  useEffect(() => { refreshPendingDocs(); }, [refreshPendingDocs]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-immigration-pickups-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "immigration_pickups" }, refreshPickups)
      .on("postgres_changes", { event: "*", schema: "public", table: "ministry_documents" }, refreshPendingDocs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshPickups, refreshPendingDocs]);

  useEffect(() => {
    if (editingPickup) {
      setSaveError(null);
      setForm({
        document_name: editingPickup.document_name,
        pickup_date: editingPickup.pickup_date,
        recipient_name: editingPickup.recipient_name ?? "",
        ministry_document_id: editingPickup.ministry_document_id,
      });
    }
  }, [editingPickup]);

  const q = search.toLowerCase();
  const filtered = q
    ? pickups.filter(
        (p) => p.document_name.toLowerCase().includes(q) || (p.recipient_name ?? "").toLowerCase().includes(q)
      )
    : pickups;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (page > max) setPage(max);
  }, [filtered.length, page]);

  const pickMinistryDoc = (id: string | null) => {
    if (!id || id === "none") {
      setForm((p) => ({ ...p, ministry_document_id: null }));
      return;
    }
    const doc = pendingDocs.find((d) => d.id === id);
    if (!doc) return;
    setForm((p) => ({ ...p, document_name: doc.document_name, ministry_document_id: doc.id }));
  };

  const handleCreate = async () => {
    setSaving(true);
    const res = await createImmigrationPickup({
      document_name: form.document_name,
      pickup_date: form.pickup_date,
      recipient_name: form.recipient_name || null,
      ministry_document_id: form.ministry_document_id,
    });
    if (res.success && res.data) {
      setPickups((prev) => [res.data as ImmigrationPickup, ...prev]);
      refreshPendingDocs();
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingPickup) return;
    setSaving(true);
    setSaveError(null);
    const res = await updateImmigrationPickup(editingPickup.id, {
      document_name: form.document_name,
      pickup_date: form.pickup_date,
      recipient_name: form.recipient_name || null,
    });
    if (res.success && res.data) {
      setPickups((prev) => prev.map((p) => (p.id === editingPickup.id ? (res.data as ImmigrationPickup) : p)));
      setEditingPickup(null);
    } else {
      setSaveError((res as { error?: string }).error ?? "Update failed. Check your permissions.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingPickup) return;
    setSaving(true);
    const res = await deleteImmigrationPickup(deletingPickup.id);
    if (res.success) {
      setPickups((prev) => prev.filter((p) => p.id !== deletingPickup.id));
      refreshPendingDocs();
      setDeletingPickup(null);
    }
    setSaving(false);
  };

  function exportCSV(data: ImmigrationPickup[]) {
    const headers = ["Name of Document", "Pickup Date", "Agent/Student Name", "Received Date"];
    const escape = (v: string | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      headers.join(","),
      ...data.map((p) => [
        escape(p.document_name),
        formatDate(p.pickup_date),
        escape(p.recipient_name),
        p.ministry_documents ? formatDate(p.ministry_documents.received_date) : "",
      ].join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `immigration_pickups_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex-1 min-w-0 px-8 py-10 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl">
            <Stamp size={22} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Document Pickup for Immigration
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Track documents picked up by agents or students for immigration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center gap-2"
            onClick={() => exportCSV(filtered)}
          >
            <Download size={16} /> Export CSV
          </Button>
          <Button
            className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2"
            onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
          >
            <Plus size={16} /> Add Pickup
          </Button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Input
          placeholder="Search by document or agent/student…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
        <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
          <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold">
            All Pickups
            <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-base">
              ({filtered.length}{q ? ` of ${pickups.length}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-6">
          {filtered.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">
              {q ? "No pickups match your search." : "No pickups recorded yet. Add one above."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name of Document</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Agent/Student Name</TableHead>
                      <TableHead>Received from Ministry</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {p.document_name}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDate(p.pickup_date)}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {p.recipient_name ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {p.ministry_documents ? (
                            <Badge className="bg-blue-500/15 text-blue-400 border-0 text-xs flex items-center gap-1 w-fit">
                              <Link2 size={11} />
                              {formatDate(p.ministry_documents.received_date)}
                              {" · "}{daysBetween(p.ministry_documents.received_date, p.pickup_date)}d
                            </Badge>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            <button
                              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setEditingPickup(p)}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setDeletingPickup(p)}
                            >
                              <Trash2 size={12} /> Del
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filtered.length > PER_PAGE && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                      disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft size={16} /> Prev
                    </Button>
                    <span className="text-sm text-slate-500 dark:text-slate-400 px-2">{page} / {totalPages}</span>
                    <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                      disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Add Document Pickup</SheetTitle>
            <SheetDescription>Fill in the pickup details below.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <PickupFormFields form={form} setForm={setForm} pendingDocs={pendingDocs} onPickMinistryDoc={pickMinistryDoc} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button
              onClick={handleCreate}
              disabled={saving || !form.document_name || !form.pickup_date}
              className="w-full bg-brand-600 hover:bg-brand-700"
            >
              {saving ? "Saving..." : "Add Pickup"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingPickup} onOpenChange={(o) => !o && setEditingPickup(null)}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Edit Pickup</SheetTitle>
            <SheetDescription>{editingPickup?.document_name}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <PickupFormFields form={form} setForm={setForm} pendingDocs={pendingDocs} onPickMinistryDoc={pickMinistryDoc} linkLocked />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border flex flex-col gap-3">
            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 w-full text-center">{saveError}</p>
            )}
            <Button
              onClick={handleUpdate}
              disabled={saving || !form.document_name || !form.pickup_date}
              className="w-full bg-brand-600 hover:bg-brand-700"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <Dialog open={!!deletingPickup} onOpenChange={(o) => !o && setDeletingPickup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Pickup</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deletingPickup?.document_name}</span>? This cannot be undone.
            {deletingPickup?.ministry_document_id && " The linked ministry document will be marked pending again."}
          </p>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PickupFormFields({ form, setForm, pendingDocs, onPickMinistryDoc, linkLocked }: {
  form: PickupForm;
  setForm: Dispatch<SetStateAction<PickupForm>>;
  pendingDocs: MinistryDocument[];
  onPickMinistryDoc: (id: string | null) => void;
  linkLocked?: boolean;
}) {
  return (
    <div className="grid gap-4">
      {!linkLocked && pendingDocs.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Link to Received Document</label>
          <Select value={form.ministry_document_id ?? "none"} onValueChange={onPickMinistryDoc}>
            <SelectTrigger className="w-full"><SelectValue placeholder="None — enter manually" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — enter manually</SelectItem>
              {pendingDocs.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.document_name} — received {formatDate(d.received_date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Matching a pending document marks it as picked up automatically.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name of Document *</label>
        <Input
          placeholder="e.g. Visa Approval Letter"
          value={form.document_name}
          onChange={(e) => setForm((p) => ({ ...p, document_name: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Pickup Date *</label>
        <DatePicker
          value={form.pickup_date}
          onChange={(v) => setForm((p) => ({ ...p, pickup_date: v }))}
          placeholder="Select pickup date"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Agent or Student Name</label>
        <Input
          placeholder="Full name"
          value={form.recipient_name}
          onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))}
        />
      </div>
    </div>
  );
}
