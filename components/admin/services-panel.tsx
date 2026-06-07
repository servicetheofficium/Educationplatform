"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Wrench, ClipboardList,
  CheckCircle2, XCircle, Download,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { Badge } from "@/components/ui/badge";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getDocumentServices, createDocumentService, updateDocumentService, deleteDocumentService,
  getServiceRequests, updateServiceRequest, deleteServiceRequest,
} from "@/lib/crud";
import type { DocumentService, ServiceRequest, ServiceRequestStatus } from "@/lib/types";

const PER_PAGE = 10;

type Tab = "catalog" | "requests" | "completed" | "cancelled";

type ServiceForm = {
  name: string;
  price_display: string;
  price_thb: number;
  detail: string;
  processing_time: string;
  note: string;
  category: "document" | "copy";
  icon_name: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: ServiceForm = {
  name: "", price_display: "", price_thb: 0, detail: "", processing_time: "",
  note: "", category: "document", icon_name: "", sort_order: 0, is_active: true,
};

const REQ_STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  pending:    "bg-yellow-500/20 text-yellow-300 border-0",
  processing: "bg-blue-500/20 text-blue-300 border-0",
  completed:  "bg-green-500/20 text-green-300 border-0",
  cancelled:  "bg-slate-500/20 text-slate-400 border-0",
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

function exportCompletedCsv(rows: ServiceRequest[]) {
  const headers = ["Name", "Email", "Phone", "Nationality", "Passport No.", "Service", "Qty", "Total (THB)", "Notes", "Completed On"];
  const escape  = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines   = rows.map((r) => [
    escape(r.name),
    escape(r.email),
    escape(r.phone),
    escape(r.nationality),
    escape(r.passport_number),
    escape(r.service_name),
    r.quantity,
    r.price_thb * r.quantity,
    escape(r.notes),
    new Date(r.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  ].join(","));
  const csv  = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `completed-services-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ServicesPanel({
  initialServices,
  initialRequests,
}: {
  initialServices?: DocumentService[];
  initialRequests?: ServiceRequest[];
} = {}) {
  const hasInitial = initialServices !== undefined;
  const [tab, setTab] = useState<Tab>("catalog");

  const [services, setServices] = useState<DocumentService[]>(initialServices ?? []);
  const [servicesLoading, setServicesLoading] = useState(!hasInitial);
  const [servicePage, setServicePage] = useState(1);

  const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests ?? []);
  const [requestsLoading, setRequestsLoading] = useState(!hasInitial);
  const [requestPage, setRequestPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [cancelledPage, setCancelledPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<DocumentService | null>(null);
  const [deletingService, setDeletingService] = useState<DocumentService | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<ServiceRequest | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitial) return;
    Promise.all([getDocumentServices(), getServiceRequests()]).then(([svc, req]) => {
      if (svc.success) setServices(svc.data as DocumentService[]);
      if (req.success) setRequests(req.data as ServiceRequest[]);
      setServicesLoading(false);
      setRequestsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const max = Math.max(1, Math.ceil(services.length / PER_PAGE));
    if (servicePage > max) setServicePage(max);
  }, [services.length, servicePage]);

  useEffect(() => {
    const maxActive    = Math.max(1, Math.ceil(requests.filter((r) => r.status === "pending" || r.status === "processing").length / PER_PAGE));
    const maxCompleted = Math.max(1, Math.ceil(requests.filter((r) => r.status === "completed").length / PER_PAGE));
    const maxCancelled = Math.max(1, Math.ceil(requests.filter((r) => r.status === "cancelled").length / PER_PAGE));
    if (requestPage   > maxActive)    setRequestPage(maxActive);
    if (completedPage > maxCompleted) setCompletedPage(maxCompleted);
    if (cancelledPage > maxCancelled) setCancelledPage(maxCancelled);
  }, [requests.length, requestPage, completedPage, cancelledPage]);

  useEffect(() => {
    if (editingService) {
      setSaveError(null);
      setServiceForm({
        name:            editingService.name,
        price_display:   editingService.price_display,
        price_thb:       editingService.price_thb,
        detail:          editingService.detail ?? "",
        processing_time: editingService.processing_time ?? "",
        note:            editingService.note ?? "",
        category:        editingService.category,
        icon_name:       editingService.icon_name ?? "",
        sort_order:      editingService.sort_order,
        is_active:       editingService.is_active,
      });
    }
  }, [editingService]);

  const activeRequests    = requests.filter((r) => r.status === "pending" || r.status === "processing");
  const completedRequests = requests.filter((r) => r.status === "completed");
  const cancelledRequests = requests.filter((r) => r.status === "cancelled");

  const pagServices   = services.slice((servicePage - 1) * PER_PAGE, servicePage * PER_PAGE);
  const pagRequests   = activeRequests.slice((requestPage - 1) * PER_PAGE, requestPage * PER_PAGE);
  const pagCompleted  = completedRequests.slice((completedPage - 1) * PER_PAGE, completedPage * PER_PAGE);
  const pagCancelled  = cancelledRequests.slice((cancelledPage - 1) * PER_PAGE, cancelledPage * PER_PAGE);
  const pendingCount  = requests.filter((r) => r.status === "pending").length;

  const handleCreate = async () => {
    setSaving(true);
    const res = await createDocumentService({
      ...serviceForm,
      detail:          serviceForm.detail || undefined,
      processing_time: serviceForm.processing_time || undefined,
      note:            serviceForm.note || undefined,
      icon_name:       serviceForm.icon_name || undefined,
    });
    if (res.success && res.data) {
      setServices((prev) => [...prev, res.data as DocumentService].sort((a, b) => a.sort_order - b.sort_order));
      setCreateOpen(false);
      setServiceForm(EMPTY_FORM);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingService) return;
    setSaving(true);
    setSaveError(null);
    const res = await updateDocumentService(editingService.id, {
      ...serviceForm,
      detail:          serviceForm.detail || undefined,
      processing_time: serviceForm.processing_time || undefined,
      note:            serviceForm.note || undefined,
      icon_name:       serviceForm.icon_name || undefined,
    });
    if (res.success && res.data) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? (res.data as DocumentService) : s))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      setEditingService(null);
    } else {
      setSaveError((res as { error?: string }).error ?? "Update failed. Check your permissions.");
    }
    setSaving(false);
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    setSaving(true);
    const res = await deleteDocumentService(deletingService.id);
    if (res.success) {
      setServices((prev) => prev.filter((s) => s.id !== deletingService.id));
      setDeletingService(null);
    }
    setSaving(false);
  };

  const handleRequestStatus = async (id: string, status: ServiceRequestStatus) => {
    const res = await updateServiceRequest(id, { status });
    if (res.success) setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const handleDeleteRequest = async () => {
    if (!deletingRequest) return;
    setSaving(true);
    const res = await deleteServiceRequest(deletingRequest.id);
    if (res.success) {
      setRequests((prev) => prev.filter((r) => r.id !== deletingRequest.id));
      setDeletingRequest(null);
    }
    setSaving(false);
  };

  const numField = (key: keyof ServiceForm) => ({
    value: String(serviceForm[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setServiceForm((p) => ({ ...p, [key]: Number(e.target.value) })),
  });

  const strField = (key: keyof ServiceForm) => ({
    value: String(serviceForm[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setServiceForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "catalog",   label: "Service Catalog",  icon: Wrench },
    { id: "requests",  label: "Active Requests",  icon: ClipboardList, count: pendingCount },
    { id: "completed", label: "Completed",        icon: CheckCircle2, count: completedRequests.length },
    { id: "cancelled", label: "Cancelled",        icon: XCircle,      count: cancelledRequests.length },
  ];

  return (
    <main className="flex-1 min-w-0 px-8 py-10 overflow-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/20 rounded-xl">
            <Wrench size={22} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Document &amp; Support Services</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage service catalog and incoming requests</p>
          </div>
        </div>
        {tab === "catalog" && (
          <Button className="bg-brand-600 hover:bg-brand-700 flex items-center gap-2"
            onClick={() => { setServiceForm(EMPTY_FORM); setCreateOpen(true); }}>
            <Plus size={16} /> Add Service
          </Button>
        )}
      </div>

      {/* ── Tab buttons ── */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700/60">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? "bg-brand-600 text-white shadow-md"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700/60"
            }`}
          >
            <Icon size={15} />
            {label}
            {count != null && count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                tab === id
                  ? "bg-white/20 text-white"
                  : id === "completed"
                    ? "bg-green-500/20 text-green-300"
                    : id === "cancelled"
                      ? "bg-slate-500/20 text-slate-400"
                      : "bg-yellow-500/20 text-yellow-300"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Catalog Tab ── */}
      {tab === "catalog" && (
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
          <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold">
                All Services
                <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-base">({services.length})</span>
              </CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-blue-500/15 text-blue-300 border-0">
                  {services.filter((s) => s.category === "document").length} document
                </Badge>
                <Badge className="bg-purple-500/15 text-purple-300 border-0">
                  {services.filter((s) => s.category === "copy").length} copy
                </Badge>
                <Badge className="bg-slate-500/15 text-slate-400 border-0">
                  {services.filter((s) => !s.is_active).length} inactive
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-6">
            {servicesLoading ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">No services yet. Add one above.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Processing Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagServices.map((svc, i) => (
                      <TableRow key={svc.id}>
                        <TableCell className="text-slate-400 dark:text-slate-500 text-xs">
                          {(servicePage - 1) * PER_PAGE + i + 1}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-white">{svc.name}</TableCell>
                        <TableCell>
                          <span className="text-brand-400 font-semibold">{svc.price_display}</span>
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm max-w-[140px] truncate">
                          {svc.detail ?? <span className="text-slate-600">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={svc.category === "document"
                            ? "bg-blue-500/15 text-blue-300 border-0 capitalize text-xs"
                            : "bg-purple-500/15 text-purple-300 border-0 capitalize text-xs"}>
                            {svc.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                          {svc.processing_time ?? <span className="text-slate-600">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={svc.is_active
                            ? "bg-green-500/15 text-green-400 border-0 text-xs"
                            : "bg-slate-500/15 text-slate-500 border-0 text-xs"}>
                            {svc.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            <button className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setEditingService(svc)}>
                              <Pencil size={12} /> Edit
                            </button>
                            <button className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                              onClick={() => setDeletingService(svc)}>
                              <Trash2 size={12} /> Del
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {services.length > PER_PAGE && (
                  <PaginationBar page={servicePage} totalPages={Math.ceil(services.length / PER_PAGE)}
                    total={services.length} perPage={PER_PAGE}
                    onPrev={() => setServicePage((p) => p - 1)} onNext={() => setServicePage((p) => p + 1)} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Requests Tab (active: pending + processing) ── */}
      {tab === "requests" && (
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
          <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold">
                Active Requests
                <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-base">({activeRequests.length})</span>
              </CardTitle>
              <div className="flex gap-2">
                {(["pending", "processing"] as ServiceRequestStatus[]).map((s) => {
                  const n = activeRequests.filter((r) => r.status === s).length;
                  if (!n) return null;
                  return <Badge key={s} className={`${REQ_STATUS_STYLES[s]} text-xs`}>{n} {s}</Badge>;
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-6">
            {requestsLoading ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">Loading requests...</p>
            ) : activeRequests.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">No active requests.</p>
            ) : (
              <>
                <RequestsTable rows={pagRequests} onStatusChange={handleRequestStatus} onDelete={setDeletingRequest} />
                {activeRequests.length > PER_PAGE && (
                  <PaginationBar page={requestPage} totalPages={Math.ceil(activeRequests.length / PER_PAGE)}
                    total={activeRequests.length} perPage={PER_PAGE}
                    onPrev={() => setRequestPage((p) => p - 1)} onNext={() => setRequestPage((p) => p + 1)} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Completed Tab ── */}
      {tab === "completed" && (
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
          <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-400" />
                Completed Services
                <span className="text-slate-400 font-normal text-base">({completedRequests.length})</span>
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">
                  ฿{completedRequests.reduce((sum, r) => sum + r.price_thb * r.quantity, 0).toLocaleString()} total
                </Badge>
                {completedRequests.length > 0 && (
                  <Button
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center gap-2"
                    onClick={() => exportCompletedCsv(completedRequests)}>
                    <Download size={16} /> Export CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-6">
            {requestsLoading ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">Loading...</p>
            ) : completedRequests.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">No completed services yet.</p>
            ) : (
              <>
                <RequestsTable rows={pagCompleted} onStatusChange={handleRequestStatus} onDelete={setDeletingRequest} dateLabel="Completed On" dateField="updated_at" />
                {completedRequests.length > PER_PAGE && (
                  <PaginationBar page={completedPage} totalPages={Math.ceil(completedRequests.length / PER_PAGE)}
                    total={completedRequests.length} perPage={PER_PAGE}
                    onPrev={() => setCompletedPage((p) => p - 1)} onNext={() => setCompletedPage((p) => p + 1)} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Cancelled Tab ── */}
      {tab === "cancelled" && (
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
          <CardHeader className="px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                <XCircle size={18} className="text-slate-400" />
                Cancelled Services
                <span className="text-slate-400 font-normal text-base">({cancelledRequests.length})</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-6">
            {requestsLoading ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">Loading...</p>
            ) : cancelledRequests.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 py-16 text-center text-sm">No cancelled services.</p>
            ) : (
              <>
                <RequestsTable rows={pagCancelled} onStatusChange={handleRequestStatus} onDelete={setDeletingRequest} dateLabel="Cancelled On" dateField="updated_at" />
                {cancelledRequests.length > PER_PAGE && (
                  <PaginationBar page={cancelledPage} totalPages={Math.ceil(cancelledRequests.length / PER_PAGE)}
                    total={cancelledRequests.length} perPage={PER_PAGE}
                    onPrev={() => setCancelledPage((p) => p - 1)} onNext={() => setCancelledPage((p) => p + 1)} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Create Service Sheet ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Add New Service</SheetTitle>
            <SheetDescription>Fill in the service details below.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ServiceFormFields form={serviceForm} setForm={setServiceForm} strField={strField} numField={numField} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button onClick={handleCreate} disabled={saving || !serviceForm.name || !serviceForm.price_display}
              className="w-full bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving..." : "Create Service"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Edit Service Sheet ── */}
      <Sheet open={!!editingService} onOpenChange={(o) => !o && setEditingService(null)}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-semibold">Edit Service</SheetTitle>
            <SheetDescription>{editingService?.name}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ServiceFormFields form={serviceForm} setForm={setServiceForm} strField={strField} numField={numField} />
          </div>
          <SheetFooter className="px-6 py-4 border-t border-border flex flex-col gap-3">
            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 w-full text-center">{saveError}</p>
            )}
            <Button onClick={handleUpdate} disabled={saving || !serviceForm.name || !serviceForm.price_display}
              className="w-full bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Delete Service Confirm ── */}
      <Dialog open={!!deletingService} onOpenChange={(o) => !o && setDeletingService(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Service</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deletingService?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDeleteService} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Request Confirm ── */}
      <Dialog open={!!deletingRequest} onOpenChange={(o) => !o && setDeletingRequest(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Request</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete request from <span className="font-semibold text-foreground">{deletingRequest?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDeleteRequest} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function RequestsTable({
  rows,
  onStatusChange,
  onDelete,
  dateLabel = "Date",
  dateField = "created_at",
}: {
  rows: ServiceRequest[];
  onStatusChange: (id: string, status: ServiceRequestStatus) => void;
  onDelete: (req: ServiceRequest) => void;
  dateLabel?: string;
  dateField?: "created_at" | "updated_at";
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requester</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>{dateLabel}</TableHead>
          <TableHead className="w-16">Del</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((req) => (
          <TableRow key={req.id}>
            <TableCell>
              <Popover>
                <PopoverTrigger className="font-medium text-slate-900 dark:text-white text-sm hover:text-blue-500 dark:hover:text-blue-400 hover:underline transition-colors text-left">
                  {req.name}
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" side="right" align="start">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{req.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Service Requester</p>
                  </div>
                  <div className="px-4 py-3 space-y-2 text-sm">
                    {([
                      ["Email",        req.email],
                      ["Phone",        req.phone],
                      ["Nationality",  req.nationality],
                      ["Passport No.", req.passport_number],
                      ["Service",      req.service_name],
                      ["Quantity",     String(req.quantity)],
                      ["Total",        `฿${(req.price_thb * req.quantity).toLocaleString()}`],
                      ["Notes",        req.notes],
                    ] as [string, string | null | undefined][]).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
                        <span className="text-slate-700 dark:text-slate-200 text-right">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{req.email}</p>
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300 text-sm max-w-[160px]">
              <span className="line-clamp-2">{req.service_name}</span>
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{req.quantity}</TableCell>
            <TableCell>
              <span className="text-brand-400 font-semibold text-sm">
                ฿{(req.price_thb * req.quantity).toLocaleString()}
              </span>
            </TableCell>
            <TableCell className="text-slate-500 dark:text-slate-400 text-xs max-w-[120px]">
              <span className="line-clamp-2">{req.notes ?? <span className="text-slate-600">—</span>}</span>
            </TableCell>
            <TableCell>
              <Select value={req.status} onValueChange={(v) => onStatusChange(req.id, v as ServiceRequestStatus)}>
                <SelectTrigger className="h-7 text-xs w-32 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50">
                  <SelectValue>
                    <Badge className={`${REQ_STATUS_STYLES[req.status]} capitalize text-xs`}>
                      {req.status}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
              {new Date(req[dateField]).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </TableCell>
            <TableCell>
              <button className="text-red-400 hover:text-red-300 transition-colors" onClick={() => onDelete(req)}>
                <Trash2 size={14} />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

function ServiceFormFields({
  form, setForm, strField, numField,
}: {
  form: ServiceForm;
  setForm: React.Dispatch<React.SetStateAction<ServiceForm>>;
  strField: (key: keyof ServiceForm) => { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void };
  numField: (key: keyof ServiceForm) => { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void };
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Service Name *</label>
        <Input placeholder="e.g. Student ID Card" {...strField("name")} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Price (THB) *</label>
        <NumberStepper
          value={form.price_thb}
          min={0}
          step={50}
          onChange={(v) => setForm((p) => ({ ...p, price_thb: v, price_display: `${v.toLocaleString()} THB` }))}
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">Display label: <span className="font-medium">{form.price_display}</span></p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Category</label>
        <Select value={form.category}
          onValueChange={(v) => setForm((p) => ({ ...p, category: v as "document" | "copy" }))}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="copy">Copy / Scan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Sort Order</label>
        <NumberStepper value={form.sort_order} min={0} onChange={(v) => setForm((p) => ({ ...p, sort_order: v }))} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Detail</label>
        <Input placeholder="e.g. per card" {...strField("detail")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Processing Time</label>
        <Input placeholder="e.g. 7 Business Days" {...strField("processing_time")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Note</label>
        <Input placeholder="e.g. Submit in person with payment" {...strField("note")} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Icon Name (Lucide)</label>
        <Input placeholder="e.g. CreditCard" {...strField("icon_name")} />
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="is_active" checked={form.is_active}
          onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
          className="w-4 h-4 accent-brand-600" />
        <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
          Active (show on website)
        </label>
      </div>
    </div>
  );
}
