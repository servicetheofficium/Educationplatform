"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Users, BookOpen, Target, DollarSign } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseDisplayData } from "./course-card";
import Image from "next/image";

interface CourseDetailsModalProps {
  course: CourseDisplayData | null;
  onClose: () => void;
}

export function CourseDetailsModal({ course, onClose }: CourseDetailsModalProps) {
  return (
    <AnimatePresence>
      {course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors"
            >
              <X size={16} className="text-slate-600" />
            </button>

            <div className="flex flex-col lg:flex-row overflow-y-auto">
              {/* Left — image with overlay info */}
              <div className="lg:w-5/12 relative h-56 lg:h-auto shrink-0">
                <Image
                  src={course.image}
                  alt={course.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={`${course.color} ${course.textColor} border-0 text-xs font-bold`}>
                    {course.language.toUpperCase()}
                  </Badge>
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-0.5 rounded-full border border-white/30 capitalize">
                    {course.level}
                  </span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl font-display font-bold text-white leading-tight mb-4">
                    {course.name}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Clock size={12} className="text-white/80" />
                      <span className="text-white text-xs font-medium">{course.duration_weeks} weeks</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Users size={12} className="text-white/80" />
                      <span className="text-white text-xs font-medium">Max {course.max_students}</span>
                    </div>
                    {course.price > 0 && (
                      <div className="flex items-center gap-1.5 bg-brand-500/80 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <DollarSign size={12} className="text-white" />
                        <span className="text-white text-xs font-bold">{course.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — content */}
              <div className="flex flex-col flex-1 p-7 lg:p-8 overflow-y-auto">
                {/* Overview */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                      <BookOpen size={14} className="text-brand-600" />
                    </div>
                    <h3 className="font-display font-bold text-slate-900">Course Overview</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {course.fullDescription}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  {/* Syllabus */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                        <Clock size={14} className="text-brand-600" />
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-sm">Syllabus</h3>
                    </div>
                    <ul className="space-y-2">
                      {course.syllabus.map((item, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Who is this for */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                        <Target size={14} className="text-brand-600" />
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-sm">Who is this for?</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {course.targetAudience}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {course.durations.map((d) => (
                        <Badge key={d} className="bg-brand-50 text-brand-600 border-0 text-xs">
                          {d} Plan
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-5 border-t border-slate-100">
                  <Link
                    href="#contact"
                    onClick={onClose}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full bg-brand-600 hover:bg-brand-700 text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-brand-500/20 h-auto text-center uppercase tracking-wide text-sm"
                    )}
                  >
                    Apply for this Course
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
