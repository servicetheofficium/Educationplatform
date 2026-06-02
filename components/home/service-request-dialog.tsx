"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createServiceRequest } from "@/lib/crud";
import type { DocumentService } from "@/lib/types";

interface ServiceRequestDialogProps {
  service: DocumentService | null;
  onClose: () => void;
}

export function ServiceRequestDialog({ service, onClose }: ServiceRequestDialogProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", nationality: "", passport_number: "", quantity: 1, notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm({ name: "", email: "", phone: "", nationality: "", passport_number: "", quantity: 1, notes: "" });
    setSubmitted(false);
    setError(null);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 300);
  }

  async function handleSubmit() {
    if (!service || !form.name || !form.email) return;
    setSubmitting(true);
    setError(null);
    const res = await createServiceRequest({
      service_id: service.id,
      service_name: service.name,
      name: form.name,
      email: form.email,
      phone: form.phone ? `+66${form.phone}` : undefined,
      nationality: form.nationality || undefined,
      passport_number: form.passport_number || undefined,
      quantity: form.quantity,
      notes: form.notes || undefined,
      price_thb: service.price_thb,
    });
    if (res.success) {
      setSubmitted(true);
    } else {
      setError((res as { error?: string }).error ?? "Submission failed. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={!!service} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-lg">Request Submitted!</p>
              <p className="text-slate-500 text-sm mt-1">
                We received your request for <strong>{service?.name}</strong>.<br />
                Please visit the school in person to complete payment.
              </p>
            </div>
            <Button onClick={handleClose} className="bg-brand-600 hover:bg-brand-700 mt-2">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request Service</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {service?.name} — <span className="font-semibold text-brand-600">{service?.price_display}</span>
              </p>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input placeholder="Your name" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email *</label>
                  <Input type="email" placeholder="your@email.com" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                      +66
                    </span>
                    <Input
                      placeholder="812345678"
                      value={form.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                        setForm((f) => ({ ...f, phone: digits }));
                      }}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" min={1} value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nationality</label>
                  <Input placeholder="e.g. Japanese" value={form.nationality}
                    onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Passport No.</label>
                  <Input placeholder="e.g. AB123456" value={form.passport_number}
                    onChange={(e) => setForm((f) => ({ ...f, passport_number: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Input placeholder="Any additional details..." value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              {service?.note && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  {service.note}
                </p>
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.email}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
