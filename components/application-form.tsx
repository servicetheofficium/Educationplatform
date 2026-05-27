"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Send, CheckCircle2, ChevronsUpDown, Check, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { createApplication } from "@/lib/crud"
import { useCourses } from "@/lib/hooks"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80, "Name must be at most 80 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[+\d][\d\s\-().]{6,19}$/.test(v), "Please enter a valid phone number."),
  course_id: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message must be at most 1000 characters."),
})

const inputCls = "h-12 rounded-xl px-4 text-sm"
const triggerCls = "h-12 rounded-xl px-4 text-sm"

export function ApplicationForm() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [courseOpen, setCourseOpen] = React.useState(false)
  const [courseSearch, setCourseSearch] = React.useState("")
  const comboboxRef = React.useRef<HTMLDivElement>(null)
  const { courses } = useCourses()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      course_id: "",
      message: "",
    },
  })

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setCourseOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q)
    )
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)
    setError("")

    try {
      const result = await createApplication({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        course_id: data.course_id || undefined,
        message: data.message,
      })

      if (result.success) {
        setSuccess(true)
        form.reset()
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || "Failed to submit application")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full relative overflow-hidden rounded-[2rem] bg-white text-slate-900 ring-0">
        <CardContent className="relative z-10 flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Application Submitted!
          </h3>
          <p className="text-green-700">
            Thank you for your interest! We&apos;ll review your application and
            contact you soon.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full relative overflow-hidden rounded-[2rem] bg-white text-slate-900 ring-0">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle className="text-3xl font-bold text-slate-900">
          Send an Inquiry
        </CardTitle>
      </CardHeader>

      <CardContent className="px-8">
        <form id="application-form" onSubmit={form.handleSubmit(onSubmit)}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <div className="grid md:grid-cols-2 gap-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="app-name" className="font-semibold text-slate-800">
                      Full Name <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="app-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="John Doe"
                      disabled={loading}
                      autoComplete="name"
                      className={inputCls}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="app-email" className="font-semibold text-slate-800">
                      Email Address <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="app-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="john@example.com"
                      disabled={loading}
                      autoComplete="email"
                      className={inputCls}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="app-phone" className="font-semibold text-slate-800">
                    Phone Number
                  </FieldLabel>
                  <Input
                    {...field}
                    id="app-phone"
                    type="tel"
                    aria-invalid={fieldState.invalid}
                    placeholder="+66 (0) 123 4567"
                    disabled={loading}
                    autoComplete="tel"
                    className={inputCls}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="course_id"
              control={form.control}
              render={({ field }) => {
                const selectedCourse = courses.find((c) => c.id === field.value)
                return (
                  <Field>
                    <FieldLabel className="font-semibold text-slate-800">
                      Course Interest
                    </FieldLabel>
                    <div ref={comboboxRef} className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={() => {
                          setCourseOpen((prev) => !prev)
                          setCourseSearch("")
                        }}
                        className={cn(triggerCls, "w-full justify-between font-normal")}
                      >
                        {selectedCourse
                          ? `${selectedCourse.name} (${selectedCourse.level})`
                          : "-- Select a course --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>

                      {courseOpen && (
                        <div className="absolute z-[200] top-full left-0 w-full mt-1 bg-white border border-input rounded-xl shadow-lg overflow-hidden">
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
                              <p className="text-center text-sm text-slate-400 py-4">
                                No courses found.
                              </p>
                            ) : (
                              filteredCourses.map((course) => (
                                <Button
                                  key={course.id}
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    field.onChange(course.id)
                                    setCourseOpen(false)
                                  }}
                                  size="default"
                                  className={cn(
                                    "w-full justify-start rounded-md font-normal h-auto py-2.5",
                                    field.value === course.id && "bg-slate-50"
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "h-4 w-4 shrink-0 text-brand-600",
                                      field.value === course.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {course.name} ({course.level})
                                </Button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Field>
                )
              }}
            />

            <Controller
              name="message"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="app-message" className="font-semibold text-slate-800">
                    Message <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="app-message"
                    placeholder="Tell us about your language learning goals..."
                    rows={5}
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                    className="rounded-xl px-4 py-3 text-sm resize-y min-h-[120px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-3 px-8 pb-8 pt-4 border-t-0 bg-transparent">
        <Button
          type="submit"
          form="application-form"
          disabled={loading}
          className="w-full h-14 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-600/20"
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
      </CardFooter>
    </Card>
  )
}
