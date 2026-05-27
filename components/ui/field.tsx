import * as React from "react"
import { FieldError as RHFFieldError } from "react-hook-form"

import { cn } from "@/lib/utils"

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />
}

function Field({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        orientation === "horizontal" && "flex-row items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({
  errors,
  className,
}: {
  errors: (RHFFieldError | undefined)[]
  className?: string
}) {
  const messages = errors
    .filter(Boolean)
    .map((e) => e?.message)
    .filter(Boolean)

  if (!messages.length) return null

  return (
    <ul className={cn("text-sm text-destructive space-y-0.5", className)}>
      {messages.map((msg, i) => (
        <li key={i}>{msg}</li>
      ))}
    </ul>
  )
}

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldError }
