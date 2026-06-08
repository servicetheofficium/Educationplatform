"use client";

import { motion } from "motion/react";
import { ArrowRight, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export interface CourseDisplayData {
  id: string;
  name: string;
  description: string;
  language: string;
  level: string;
  price: number;
  duration_weeks: number;
  max_students: number;
  image: string;
  color: string;
  textColor: string;
  borderColor: string;
  durations: string[];
  benefits: string[];
  fullDescription: string;
  syllabus: string[];
  targetAudience: string;
}

interface CourseCardProps {
  course: CourseDisplayData;
  onSeeDetails: (course: CourseDisplayData) => void;
  index?: number;
}

export function CourseCard({ course, onSeeDetails, index = 0 }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="pt-6 h-full"
    >
      <div className="relative bg-white rounded-2xl shadow-md flex flex-col h-[450px]">
        {/* Floating image — negative margin lifts it above card */}
        <div className="mx-4 -mt-6 h-52 shrink-0 rounded-xl overflow-hidden shadow-lg shadow-brand-500/60 relative z-10">
          <Image
            src={course.image}
            alt={course.name}
            fill
            sizes="340px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3">
            <Badge className={`${course.color} ${course.textColor} border-0 text-xs font-bold px-2.5 py-0.5`}>
              {course.language.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30 capitalize">
              {course.level}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-0 flex flex-col flex-1 overflow-hidden">
          <h5 className="mb-2 font-display text-lg font-semibold leading-snug text-slate-900 line-clamp-1">
            {course.name}
          </h5>
          <p className="text-sm font-light leading-relaxed text-slate-500 line-clamp-3 flex-1">
            {course.description}
          </p>
        </div>

        {/* Footer with divider */}
        <div className="px-6 pt-3 pb-5">
          <div className="flex items-center gap-4 border-t border-slate-100 pt-3 mb-4">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-brand-500" />
              <span className="text-xs text-slate-500 font-medium">{course.duration_weeks} weeks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-brand-500" />
              <span className="text-xs text-slate-500 font-medium">Max {course.max_students}</span>
            </div>
          </div>

          <Button
            onClick={() => onSeeDetails(course)}
            className="select-none rounded-xl bg-brand-600 hover:bg-brand-700 py-3 px-6 text-xs font-bold uppercase text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/40 transition-all h-auto group/btn"
          >
            See Details
            <ArrowRight size={13} className="ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
