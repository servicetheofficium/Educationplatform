"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CourseCard, CourseDetailsModal } from "./index";
import type { Course } from "@/lib/types";
import type { CourseDisplayData } from "./course-card";

interface CoursesSectionProps {
  courses: Course[];
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800";

function toCourseDisplayData(course: Course): CourseDisplayData {
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    language: course.language,
    level: course.level,
    price: course.price,
    duration_weeks: course.duration_weeks,
    max_students: course.max_students,
    image: course.image_url ?? FALLBACK_IMAGE,
    color: course.language === "English" ? "bg-blue-100" : "bg-orange-100",
    textColor: course.language === "English" ? "text-blue-600" : "text-orange-600",
    borderColor: course.language === "English" ? "border-blue-200" : "border-orange-200",
    durations: [`${course.duration_weeks} weeks`],
    benefits: [
      `Learn ${course.language} at ${course.level} level`,
      `Max ${course.max_students} students per class`,
      "Interactive and engaging sessions",
    ],
    fullDescription:
      course.description ||
      `Master ${course.language} with our comprehensive ${course.level} level course.`,
    syllabus: [
      "Fundamentals and core concepts",
      "Communication skills development",
      "Grammar and vocabulary building",
      "Practical conversation practice",
      "Cultural immersion and context",
    ],
    targetAudience: `Perfect for ${
      course.level === "beginner"
        ? "complete beginners"
        : course.level === "intermediate"
        ? "intermediate learners"
        : "advanced learners"
    } who want to improve their ${course.language} skills.`,
  };
}

export function CoursesSection({ courses }: CoursesSectionProps) {
  const [selectedCourse, setSelectedCourse] = useState<CourseDisplayData | null>(null);
  const [search, setSearch] = useState("");

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span className="text-brand-600 font-bold tracking-widest uppercase text-sm block mb-3 font-display">
            Our Programs
          </span>
          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
            Tailored courses for global citizens
          </h2>
        </div>

        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, language, or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            {search ? `No courses match "${search}"` : "No courses available"}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={toCourseDisplayData(course)}
                onSeeDetails={setSelectedCourse}
              />
            ))}
          </div>
        )}
      </div>

      <CourseDetailsModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />
    </>
  );
}
