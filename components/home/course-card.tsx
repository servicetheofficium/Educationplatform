"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
}

export function CourseCard({ course, onSeeDetails }: CourseCardProps) {
  return (
    <Card className={`rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-500 group ${course.borderColor} p-0 flex flex-col h-full`}>
      <div className="h-56 overflow-hidden relative shrink-0">
        <Image
          src={course.image}
          alt={course.name}
          width={800}
          height={450}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <Badge className={`${course.color} ${course.textColor} border-0 shadow-sm backdrop-blur-md`}>
            {course.name.toUpperCase()}
          </Badge>
        </div>
      </div>
      <CardContent className="p-8 bg-white flex flex-col flex-1">
        <h3 className="text-xl font-display font-bold text-slate-900 mb-4 leading-snug">
          {course.name}
        </h3>
        <p className="text-slate-600 mb-6 line-clamp-3">{course.description}</p>

        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {course.durations.map((d) => (
              <Badge key={d} variant="outline" className="text-slate-500">
                {d} Option
              </Badge>
            ))}
          </div>
          <ul className="space-y-2">
            {course.benefits.slice(0, 3).map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => onSeeDetails(course)}
          className="w-full bg-slate-900 hover:bg-brand-600 text-white rounded-2xl py-3.5 font-bold h-auto group/btn mt-auto"
        >
          See Full Details
          <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
