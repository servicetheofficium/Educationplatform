"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Clock, Globe } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseDisplayData } from "./course-card";
import Image from "next/image";

interface CourseDetailsModalProps {
  course: CourseDisplayData | null;
  onClose: () => void;
}

export function CourseDetailsModal({ course, onClose }: CourseDetailsModalProps) {
  if (!course) return null;

  return (
    <AnimatePresence>
      {course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full z-20"
            >
              <X size={24} className="text-slate-600" />
            </Button>

            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 relative h-64 lg:h-auto">
                <Image
                  src={course.image}
                  alt={course.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <Badge className={`${course.color} ${course.textColor} border-0 shadow-sm backdrop-blur-md mb-3`}>
                    {course.id.toUpperCase()}
                  </Badge>
                  <h2 className="text-3xl font-display font-bold">{course.name}</h2>
                </div>
              </div>

              <div className="lg:w-3/5 p-8 lg:p-12">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <BookOpen size={20} className="text-brand-500" /> Course Overview
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {course.fullDescription}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Clock size={20} className="text-brand-500" /> Syllabus
                        Highlights
                      </h3>
                      <ul className="space-y-2">
                        {course.syllabus.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-600 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Globe size={20} className="text-brand-500" /> Who is this for?
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {course.targetAudience}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {course.durations.map((d) => (
                          <Badge key={d} className="bg-brand-50 text-brand-600 border-0">
                            {d} Plan
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                    <Link
                      href="#contact"
                      onClick={onClose}
                      className={cn(buttonVariants({ variant: "default" }), "flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold shadow-lg shadow-brand-500/20 h-auto text-center")}
                    >
                      Apply for this Course
                    </Link>
                    <Button
                      variant="secondary"
                      onClick={onClose}
                      className="px-8 py-4 rounded-xl font-bold h-auto"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
