"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

const CARD_WIDTH = 340;
const CARD_GAP = 24;
const SCROLL_SPEED = 0.35;

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(undefined);
  const paused = useRef(false);
  const wheelResumeRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q)
    );
  });

  const startAutoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const tick = () => {
      if (!paused.current && el) {
        el.scrollLeft += SCROLL_SPEED;
        // Seamless loop: jump back when first copy fully scrolled past
        const halfWidth = (CARD_WIDTH + CARD_GAP) * filtered.length;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [filtered.length]);

  useEffect(() => {
    if (search) return; // no auto-scroll in search mode
    startAutoScroll();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [search, startAutoScroll]);

  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };

  // Convert vertical wheel to horizontal scroll in auto mode
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (search) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
      pause();
      clearTimeout(wheelResumeRef.current);
      wheelResumeRef.current = setTimeout(resume, 1000);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [search]);
  // Resume after touch ends with short delay so user can read before scroll continues
  const resumeDelayed = () => { setTimeout(() => { paused.current = false; }, 1200); };

  return (
    <>
      <div className="container mx-auto max-w-6xl px-8 py-6">
        <div className="mb-12 text-center">
          <span className="text-brand-600 font-bold tracking-widest uppercase text-sm block mb-3 font-display">
            Our Programs
          </span>
          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
            Tailored courses for global citizens
          </h2>
        </div>

        <div className="relative mb-10 max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
          <Input
            placeholder="Search by name, language, or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-11 pr-4 rounded-2xl border-slate-200 bg-white shadow-sm text-sm focus-visible:border-brand-400 focus-visible:ring-brand-400/20"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            {search ? `No courses match "${search}"` : "No courses available"}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-hidden no-scrollbar marquee-fade py-6"
            onMouseEnter={pause}
            onMouseLeave={resume}
            onTouchStart={pause}
            onTouchEnd={resumeDelayed}
          >
            <div className={`flex ${search ? "w-max mx-auto" : ""}`}>
              {(search ? filtered : [...filtered, ...filtered]).map((course, i) => (
                <div key={`${course.id}-${i}`} className="w-[340px] shrink-0 pr-6">
                  <CourseCard
                    course={toCourseDisplayData(course)}
                    onSeeDetails={setSelectedCourse}
                    index={i % filtered.length}
                  />
                </div>
              ))}
            </div>
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
