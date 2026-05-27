"use client";

import { motion } from "motion/react";
import { Navigation, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SCHOOL_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Hero() {
  return (
    <section
      id="home"
      className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 hero-gradient relative overflow-hidden"
    >
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
            <Navigation size={14} /> NEW SEMESTER REGISTRATION OPEN
          </span>
          <h1 className="text-4xl lg:text-6xl font-display font-extrabold text-slate-900 leading-[1.1] mb-6">
            Unlock Your Future with{" "}
            <span className="text-brand-600 italic">Language</span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Embark on a transformative journey with {SCHOOL_NAME}. Whether
            it&apos;s mastering English for your career or Thai for your new
            life, we&apos;re here to guide you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              href="#courses"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full sm:w-auto bg-brand-600 hover:bg-brand-700 rounded-2xl px-8 py-4 font-bold text-lg shadow-xl shadow-brand-600/20 group h-auto"
              )}
            >
              Explore Courses
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#about"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto rounded-2xl px-8 py-4 font-bold text-lg h-auto"
              )}
            >
              Learn More
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <Image
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white grayscale hover:grayscale-0 transition-all cursor-pointer"
                  src={`https://i.pravatar.cc/150?u=${i + 12}`}
                  alt="Student"
                  width={40}
                  height={40}
                />
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Joined by{" "}
              <span className="text-slate-900 font-bold">500+ students</span>{" "}
              this year
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative"
        >
          <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-700 border-8 border-white">
            <Image
              src="https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&q=80&w=1000"
              alt="Students learning"
              width={1000}
              height={750}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
