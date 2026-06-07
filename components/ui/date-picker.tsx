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
          "w-full h-10 flex items-center justify-start gap-2 rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 text-sm",
          "hover:border-ring transition-colors focus-visible:outline-none",
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
          captionLayout="dropdown"
          startMonth={new Date(2015, 0)}
          endMonth={new Date(2035, 11)}
          className="w-auto [--cell-size:auto]"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
        />
      </PopoverContent>
    </Popover>
  );
}
