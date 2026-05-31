"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "w-full h-10 flex items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon size={14} className="shrink-0" />
        {value ? format(parseISO(value), "dd MMM yyyy") : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-1 border" align="start">
        <Calendar
          mode="single"
          className="w-auto [--cell-size:auto]"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
        />
      </PopoverContent>
    </Popover>
  );
}
