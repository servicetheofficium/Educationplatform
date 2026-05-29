"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Zap,
  Clock,
  CreditCard,
  Camera,
  Building2,
  Smartphone,
  BookOpen,
  Copy,
  AlertCircle,
} from "lucide-react";

const DOCUMENT_SERVICES = [
  {
    icon: FileText,
    name: "Immigration Form Completion",
    price: "800 THB",
    detail: "per set / per request",
    note: "Submit in person with payment",
  },
  {
    icon: Zap,
    name: "Urgent Document Processing",
    price: "800 THB",
    detail: "per request",
    time: "Within 7 Business Days",
    note: "Submit in person with payment",
  },
  {
    icon: Clock,
    name: "Standard Document Processing",
    price: "500 THB",
    detail: "per request",
    time: "Within 15 Business Days",
    note: "Submit in person with payment",
  },
  {
    icon: CreditCard,
    name: "Student ID Card",
    price: "300 THB",
    detail: "per card",
    time: "7 Business Days",
  },
  {
    icon: Camera,
    name: "Photo Service",
    price: "150 THB",
    detail: "per 6 photos",
    time: "Photography service included",
  },
  {
    icon: Building2,
    name: "Bank Document Service",
    price: "700 THB",
    detail: "",
    time: "7 Business Days",
  },
  {
    icon: Building2,
    name: "Bank Document + Student ID Package",
    price: "1,000 THB",
    detail: "",
    time: "7 Business Days",
  },
  {
    icon: Smartphone,
    name: "SIM Card",
    price: "300 THB",
    detail: "for students without Thai number",
    time: "Prices may change without notice",
  },
  {
    icon: BookOpen,
    name: "Textbooks",
    price: "500 THB",
    detail: "per book",
  },
];

const COPY_SERVICES = [
  { name: "Black & White Copies", price: "3 THB / page" },
  { name: "Color Copies", price: "10 THB / page" },
  { name: "Color Scanning", price: "10 THB / page" },
];

export function ServicesSection() {
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {DOCUMENT_SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="h-full"
              >
                <Card className="h-full rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Top: icon + price always same row */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                        <Icon size={20} />
                      </div>
                      <span className="text-lg font-bold text-brand-600 whitespace-nowrap">
                        {service.price}
                      </span>
                    </div>
                    {/* Middle: name + detail always at same vertical position */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                        {service.name}
                      </h4>
                      {service.detail && (
                        <p className="text-slate-500 text-xs mt-0.5">{service.detail}</p>
                      )}
                    </div>
                    {/* Time row: always takes same space whether present or not */}
                    <p className="text-xs text-slate-500 flex items-center gap-1 min-h-[1.25rem]">
                      {service.time && (
                        <>
                          <Clock size={11} className="shrink-0" />
                          {service.time}
                        </>
                      )}
                    </p>
                    {/* Note: pinned to bottom */}
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

        {/* Copying & Scanning */}
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
                {COPY_SERVICES.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center bg-slate-50 rounded-xl px-4 py-4 gap-1"
                  >
                    <span className="text-slate-700 text-sm font-medium">{s.name}</span>
                    <span className="text-brand-600 font-bold text-base">{s.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
    </section>
  );
}
