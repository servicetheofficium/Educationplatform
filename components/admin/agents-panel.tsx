"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Users, Search } from "lucide-react";
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { getAgents, createAgent, updateAgent, deleteAgent } from "@/lib/crud";
import type { Agent } from "@/lib/types";

const PER_PAGE = 10;

type AgentForm = {
  name: string;
  phone: string;
  email: string;
  nationality: string;
  company_name: string;
  id_passport_number: string;
};

const EMPTY_FORM: AgentForm = {
  name: "", phone: "", email: "", nationality: "", company_name: "", id_passport_number: "",
};

function PaginationBar({ page, totalPages, total, perPage, onPrev, onNext }: {
  page: number; totalPages: number; total: number; perPage: number;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
          disabled={page === 1} onClick={onPrev}>
          <ChevronLeft size={16} /> Prev
        </Button>
        <span className="text-sm text-slate-500 dark:text-slate-400 px-2">{page} / {totalPages}</span>
        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
          disabled={page === totalPages} onClick={onNext}>
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

export function AgentsPanel({ initialAgents }: { initialAgents?: Agent[] } = {}) {
  const hasInitial = initialAgents !== undefined;
  const [agents, setAgents] = useState<Agent[]>(initialAgents ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitial) return;
    getAgents().then((res) => {
      if (res.success) setAgents(res.data as Agent[]);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingAgent) {
      setSaveError(null);
      setForm({
        name: editingAgent.name,
        phone: editingAgent.phone ?? "",
        email: editingAgent.email ?? "",
        nationality: editingAgent.nationality ?? "",
        company_name: editingAgent.company_name ?? "",
        id_passport_number: editingAgent.id_passport_number ?? "",
      });
    }
  }, [editingAgent]);

  const q = search.toLowerCase();
  const filtered = q
    ? agents.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.phone ?? "").includes(q) ||
        (a.nationality ?? "").toLowerCase().includes(q) ||
        (a.company_name ?? "").toLowerCase().includes(q) ||
        (a.id_passport_number ?? "").toLowerCase().includes(q)
      )
    : agents;

  useEffect(() => {
    const max = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (page > max) setPage(max);
  }, [filtered.length, page]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const strField = (key: keyof AgentForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  async function handleCreate() {
    setSaving(true);
    const res = await createAgent({
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      nationality: form.nationality || undefined,
      company_name: form.company_name || undefined,
      id_passport_number: form.id_passport_number || undefined,
    });
    if (res.success && res.data) {
      setAgents((prev) => [...prev, res.data as Agent].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  }

  async function handleUpdate() {
    if (!editingAgent) return;
    setSaving(true);
    setSaveError(null);
    const res = await updateAgent(editingAgent.id, {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      nationality: form.nationality || undefined,
      company_name: form.company_name || undefined,
      id_passport_number: form.id_passport_number || undefined,
    });
    if (res.success && res.data) {
      setAgents((prev) =>
        prev.map((a) => (a.id === editingAgent.id ? (res.data as Agent) : a))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingAgent(null);
    } else {
      setSaveError((res as { error?: string }).error ?? "Update failed. Check your permissions.");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deletingAgent) return;
    setSaving(true);
    const res = await deleteAgent(deletingAgent.id);
    if (res.success) {
      setAgents((prev) => prev.filter((a) => a.id !== deletingAgent.id));
      setDeletingAgent(null);
    }
    setSaving(false);
  }

  return (
    <main className="flex-1 min-w-0 px-8 py-10 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/20 rounded-xl">
            <Users size={22} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Agent List</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage partner agents</p>
          </div>
        </div>
        <Button className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2"
          onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}>
          <Plus size={16} /> Add Agent
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Search by name, email, phone, company, passport..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-9 bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-brand-500"
        />
      </div>

      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
        <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
          <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold">
            All Agents
            <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-base">({filtered.length}{q ? ` of ${agents.length}` : ""})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-6">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">Loading agents...</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">{q ? "No agents match your search." : "No agents yet. Add one above."}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Company Name</TableHead>
                      <TableHead>ID/Passport No.</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{agent.name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{agent.phone ?? "—"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{agent.email ?? "—"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{agent.nationality ?? "—"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{agent.company_name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">{agent.id_passport_number ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            <button className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setEditingAgent(agent)}>
                              <Pencil size={12} /> Edit
                            </button>
                            <button className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setDeletingAgent(agent)}>
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
                <PaginationBar page={page} totalPages={Math.ceil(filtered.length / PER_PAGE)}
                  total={filtered.length} perPage={PER_PAGE}
                  onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Add New Agent</SheetTitle>
            <SheetDescription>Fill in the agent details below.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AgentFormFields strField={strField} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button onClick={handleCreate} disabled={saving || !form.name}
              className="w-full bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving..." : "Create Agent"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit */}
      <Sheet open={!!editingAgent} onOpenChange={(o) => !o && setEditingAgent(null)}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Edit Agent</SheetTitle>
            <SheetDescription>{editingAgent?.name}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AgentFormFields strField={strField} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border flex flex-col gap-3">
            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 w-full text-center">{saveError}</p>
            )}
            <Button onClick={handleUpdate} disabled={saving || !form.name}
              className="w-full bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <Dialog open={!!deletingAgent} onOpenChange={(o) => !o && setDeletingAgent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Agent</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deletingAgent?.name}</span>? This cannot be undone.
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

function AgentFormFields({
  strField,
}: {
  strField: (key: keyof AgentForm) => { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void };
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Agent Name *</label>
        <Input placeholder="e.g. John Doe" {...strField("name")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Phone Number</label>
        <Input placeholder="e.g. +66 812345678" {...strField("phone")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="agent@example.com" {...strField("email")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nationality</label>
        <Input placeholder="e.g. Thai" {...strField("nationality")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Company Name</label>
        <Input placeholder="e.g. ABC Education Agency" {...strField("company_name")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">ID / Passport Number</label>
        <Input placeholder="e.g. AB1234567" {...strField("id_passport_number")} />
      </div>
    </div>
  );
}
