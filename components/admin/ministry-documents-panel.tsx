"use client";

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { Landmark, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getMinistryDocuments, createMinistryDocument, updateMinistryDocument, deleteMinistryDocument,
} from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { MinistryDocument } from "@/lib/types";

const PER_PAGE = 10;

type DocForm = {
  document_name: string;
  received_date: string;
  staff_name: string;
};

const EMPTY_FORM: DocForm = { document_name: "", received_date: "", staff_name: "" };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function MinistryDocumentsPanel({ initialDocuments }: { initialDocuments: MinistryDocument[] }) {
  const [documents, setDocuments] = useState<MinistryDocument[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<MinistryDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<MinistryDocument | null>(null);
  const [form, setForm] = useState<DocForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    const res = await getMinistryDocuments();
    if (res.success) setDocuments(res.data as MinistryDocument[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-ministry-documents-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "ministry_documents" }, refreshDocuments)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshDocuments]);

  useEffect(() => {
    if (editingDoc) {
      setSaveError(null);
      setForm({
        document_name: editingDoc.document_name,
        received_date: editingDoc.received_date,
        staff_name: editingDoc.staff_name ?? "",
      });
    }
  }, [editingDoc]);

  const q = search.toLowerCase();
  const filtered = q
    ? documents.filter(
        (d) => d.document_name.toLowerCase().includes(q) || (d.staff_name ?? "").toLowerCase().includes(q)
      )
    : documents;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (page > max) setPage(max);
  }, [filtered.length, page]);

  const handleCreate = async () => {
    setSaving(true);
    const res = await createMinistryDocument({
      document_name: form.document_name,
      received_date: form.received_date,
      staff_name: form.staff_name || null,
    });
    if (res.success && res.data) {
      setDocuments((prev) => [res.data as MinistryDocument, ...prev]);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingDoc) return;
    setSaving(true);
    setSaveError(null);
    const res = await updateMinistryDocument(editingDoc.id, {
      document_name: form.document_name,
      received_date: form.received_date,
      staff_name: form.staff_name || null,
    });
    if (res.success && res.data) {
      setDocuments((prev) => prev.map((d) => (d.id === editingDoc.id ? (res.data as MinistryDocument) : d)));
      setEditingDoc(null);
    } else {
      setSaveError((res as { error?: string }).error ?? "Update failed. Check your permissions.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setSaving(true);
    const res = await deleteMinistryDocument(deletingDoc.id);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== deletingDoc.id));
      setDeletingDoc(null);
    }
    setSaving(false);
  };

  function exportCSV(data: MinistryDocument[]) {
    const headers = ["Name of Document", "Date Received", "Staff Name"];
    const escape = (v: string | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      headers.join(","),
      ...data.map((d) => [escape(d.document_name), formatDate(d.received_date), escape(d.staff_name)].join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ministry_documents_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex-1 min-w-0 px-8 py-10 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/20 rounded-xl">
            <Landmark size={22} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Documents Received from Ministry
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Track documents received from the Ministry
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
            <Plus size={16} /> Add Document
          </Button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Input
          placeholder="Search by document name or staff…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
        <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
          <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold">
            All Documents
            <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-base">
              ({filtered.length}{q ? ` of ${documents.length}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-6">
          {filtered.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">
              {q ? "No documents match your search." : "No documents recorded yet. Add one above."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name of Document</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {doc.document_name}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDate(doc.received_date)}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {doc.staff_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {doc.picked_up_at ? (
                            <Badge className="bg-green-500/15 text-green-400 border-0 text-xs">
                              Picked Up {formatDate(doc.picked_up_at)}
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/15 text-yellow-400 border-0 text-xs">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            <button
                              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setEditingDoc(doc)}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setDeletingDoc(doc)}
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
            <SheetTitle className="text-lg font-semibold">Add Ministry Document</SheetTitle>
            <SheetDescription>Fill in the document details below.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <DocFormFields form={form} setForm={setForm} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button
              onClick={handleCreate}
              disabled={saving || !form.document_name || !form.received_date}
              className="w-full bg-brand-600 hover:bg-brand-700"
            >
              {saving ? "Saving..." : "Add Document"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingDoc} onOpenChange={(o) => !o && setEditingDoc(null)}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Edit Document</SheetTitle>
            <SheetDescription>{editingDoc?.document_name}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <DocFormFields form={form} setForm={setForm} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border flex flex-col gap-3">
            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 w-full text-center">{saveError}</p>
            )}
            <Button
              onClick={handleUpdate}
              disabled={saving || !form.document_name || !form.received_date}
              className="w-full bg-brand-600 hover:bg-brand-700"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <Dialog open={!!deletingDoc} onOpenChange={(o) => !o && setDeletingDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Document</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deletingDoc?.document_name}</span>? This cannot be undone.
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

function DocFormFields({ form, setForm }: {
  form: DocForm;
  setForm: Dispatch<SetStateAction<DocForm>>;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name of Document *</label>
        <Input
          placeholder="e.g. Visa Approval Letter"
          value={form.document_name}
          onChange={(e) => setForm((p) => ({ ...p, document_name: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Date Received *</label>
        <DatePicker
          value={form.received_date}
          onChange={(v) => setForm((p) => ({ ...p, received_date: v }))}
          placeholder="Select date received"
        />
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
  );
}
