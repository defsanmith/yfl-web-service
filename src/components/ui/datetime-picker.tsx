"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DateTimePicker({
  date,
  onSelect,
  placeholder = "Pick a date and time",
  disabled = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date
  );
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "12:00"
  );

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined);
      onSelect(undefined);
      return;
    }

    // Preserve the time when selecting a new date
    const [hours, minutes] = timeValue.split(":").map(Number);
    newDate.setHours(hours, minutes, 0, 0);
    setSelectedDate(newDate);
    onSelect(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
      onSelect(newDate);
    }
  };

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="relative flex items-center">
          <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled || !selectedDate}
            className="w-[160px] pl-9"
          />
        </div>
      </div>
    </div>
  );
}
