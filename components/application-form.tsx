"use client";

import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, ChevronsUpDown, Check, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { createApplication } from "@/lib/crud";
import { useCourses } from "@/lib/hooks";

export function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    course_id: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const comboboxRef = useRef<HTMLDivElement>(null);
  const { courses } = useCourses();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setCourseOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q)
    );
  });

  const selectedCourse = courses.find((c) => c.id === formData.course_id);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in all required fields (Name, Email, Message)");
      setLoading(false);
      return;
    }

    try {
      const result = await createApplication({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        course_id: formData.course_id || undefined,
        message: formData.message,
      });

      if (result.success) {
        setSuccess(true);
        setFormData({ name: "", email: "", phone: "", course_id: "", message: "" });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || "Failed to submit application");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-900 mb-2">
          Application Submitted!
        </h3>
        <p className="text-green-700 mb-4">
          Thank you for your interest! We&apos;ll review your application and contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+66 (0) 123 4567"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Course Interest</Label>
        <div ref={comboboxRef} className="relative">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setCourseOpen((prev) => !prev);
              setCourseSearch("");
            }}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-between font-normal"
            )}
          >
            {selectedCourse
              ? `${selectedCourse.name} (${selectedCourse.level})`
              : "-- Select a course --"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>

          {courseOpen && (
            <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-input rounded-lg shadow-lg overflow-hidden">
              <div className="p-2 border-b border-input">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm outline-none bg-transparent placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filteredCourses.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">No courses found.</p>
                ) : (
                  filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, course_id: course.id }));
                        setCourseOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-50 flex items-center gap-2 transition-colors",
                        formData.course_id === course.id && "bg-slate-50"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 text-brand-600",
                          formData.course_id === course.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {course.name} ({course.level})
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your language learning goals..."
          disabled={loading}
          required
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 h-auto shadow-lg shadow-brand-600/20"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          <>
            <Send size={18} className="mr-2" />
            Submit Application
          </>
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        <span className="text-red-500">*</span> Required fields
      </p>
    </form>
  );
}
