"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURES } from "@/lib/constants";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-16 text-center">
          <span className="text-brand-600 font-bold tracking-widest uppercase text-sm block mb-3 font-display">
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
            We provide the best environment for your education & Visa Services
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-0">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                      <Icon size={28} />
                    </div>
                    <h4 className="text-xl font-display font-bold text-slate-900 mb-3">
                      {feature.title}
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
