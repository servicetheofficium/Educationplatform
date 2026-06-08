"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText, Zap, Clock, CreditCard, Camera, Building2, Smartphone,
  BookOpen, Copy, AlertCircle, HelpCircle, Landmark,
} from "lucide-react";
import { useState } from "react";
import type { ElementType } from "react";
import { useDocumentServices } from "@/lib/hooks";
import { ServiceRequestDialog } from "./service-request-dialog";
import type { DocumentService } from "@/lib/types";

const ICON_MAP: Record<string, ElementType> = {
  FileText, Zap, Clock, CreditCard, Camera, Building2, Smartphone,
  BookOpen, Copy, AlertCircle, Landmark,
};

function resolveIcon(name: string | null): ElementType {
  return name ? (ICON_MAP[name] ?? HelpCircle) : HelpCircle;
}

export function ServicesSection() {
  const { services, loading } = useDocumentServices();
  const [selectedService, setSelectedService] = useState<DocumentService | null>(null);

  const docServices = services.filter((s) => s.category === "document");
  const copyServices = services.filter((s) => s.category === "copy");

  return (
    <section id="services" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="text-brand-600 font-bold tracking-widest uppercase text-sm block mb-3 font-display">
            Additional Services
          </span>
          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
            Document & Support Services
          </h2>
          <p className="text-slate-600 mt-4 max-w-xl mx-auto">
            We offer a range of support services to help students with immigration documents, IDs, and more.
          </p>
        </div>

        {/* Document Services Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {docServices.map((service, i) => {
              const Icon = resolveIcon(service.icon_name);
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="h-full"
                >
                  <Card
                    className="h-full rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all bg-white cursor-pointer group"
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                          <Icon size={20} />
                        </div>
                        <span className="text-lg font-bold text-brand-600 whitespace-nowrap">
                          {service.price_display}
                        </span>
                      </div>
                      <div className="mb-3">
                        <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                          {service.name}
                        </h4>
                        {service.detail && (
                          <p className="text-slate-500 text-xs mt-0.5">{service.detail}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 min-h-[1.25rem]">
                        {service.processing_time && (
                          <>
                            <Clock size={11} className="shrink-0" />
                            {service.processing_time}
                          </>
                        )}
                      </p>
                      {service.note && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 leading-snug mt-auto pt-3">
                          {service.note}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Copying & Scanning */}
        {!loading && copyServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                    <Copy size={20} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900">
                    Copying & Scanning Services
                  </h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {copyServices.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col items-center text-center bg-slate-50 rounded-xl px-4 py-4 gap-1"
                    >
                      <span className="text-slate-700 text-sm font-medium">{s.name}</span>
                      <span className="text-brand-600 font-bold text-base">{s.price_display}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="rounded-2xl border border-slate-300 bg-slate-100">
            <CardContent className="p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-slate-500 shrink-0 mt-0.5" />
                <h3 className="font-semibold text-slate-700">Disclaimer</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed pl-8">
                <p>
                  All fees, processing times, conditions, visa regulations, and immigration procedures are subject to change without prior notice in accordance with school policies, university requirements, immigration regulations, and relevant government authorities.
                </p>
                <p>
                  The school acts solely as an educational institution and document provider. Visa approvals, visa durations, extensions, and immigration decisions are solely at the discretion of the relevant government authorities.
                </p>
                <p>
                  The school does not guarantee visa approval, extension approval, processing timelines, or immigration outcomes under any circumstances.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ServiceRequestDialog
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </section>
  );
}
