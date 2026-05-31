"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className,
}: NumberStepperProps) {
  const [inputVal, setInputVal] = useState(String(value));

  useEffect(() => {
    setInputVal(String(value));
  }, [value]);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const decrement = () => {
    const next = clamp(value - step);
    onChange(next);
  };

  const increment = () => {
    const next = clamp(value + step);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputVal(raw);
    const num = Number(raw);
    if (raw !== "" && !isNaN(num)) {
      onChange(clamp(num));
    }
  };

  const handleBlur = () => {
    const num = Number(inputVal);
    if (inputVal === "" || isNaN(num)) {
      setInputVal(String(value));
    } else {
      const clamped = clamp(num);
      setInputVal(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-lg"
        onClick={decrement}
        disabled={min !== undefined && value <= min}
      >
        <Minus size={14} />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        value={inputVal}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="flex-1 h-10 w-0 min-w-0 text-center rounded-lg border border-input bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-ring focus:border-ring"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-lg"
        onClick={increment}
        disabled={max !== undefined && value >= max}
      >
        <Plus size={14} />
      </Button>
    </div>
  );
}
