"use client";

import { motion } from "motion/react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCHOOL_NAME } from "@/lib/constants";
import Image from "next/image";

export function AboutSection() {
  return (
    <section id="about" className="py-24 px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=500"
                alt="Learning"
                width={500}
                height={400}
                className="rounded-2xl"
              />
              <Image
                src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?auto=format&fit=crop&q=80&w=500"
                alt="Study"
                width={500}
                height={400}
                className="rounded-2xl mt-8"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white">
              <p className="text-4xl font-display font-black text-brand-600 mb-1">
                10+
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Years of Teaching
              </p>
            </div>
          </div>
          <div className="flex-1 order-1 lg:order-2">
            <div className="mb-16">
              <span className="text-brand-600 font-bold tracking-widest uppercase text-sm block mb-3 font-display">
                About our school
              </span>
              <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                Where language meets opportunity
              </h2>
            </div>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              Founded in 2026, {SCHOOL_NAME} has been at the forefront of
              language education in international hubs. We believe that learning
              a new language is the most powerful way to open doors to new
              careers, cultures, and friendships.
            </p>
            <div className="space-y-4 mb-10">
              {[
                "Personalized learning paths",
                "Modern classroom technology",
                "Global alumni network",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="p-1 bg-brand-100 rounded-full text-brand-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
