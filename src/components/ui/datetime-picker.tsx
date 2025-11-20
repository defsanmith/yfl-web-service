"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DateTimePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  date,
  onSelect,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  // Extract initial time values from the date
  const initialHour = date ? date.getHours() : 12;
  const initialMinute = date ? date.getMinutes() : 0;
  const initialPeriod = initialHour >= 12 ? "PM" : "AM";
  const initial12Hour =
    initialHour === 0 ? 12 : initialHour > 12 ? initialHour - 12 : initialHour;

  const [hour, setHour] = useState<number>(initial12Hour);
  const [minute, setMinute] = useState<number>(initialMinute);
  const [period, setPeriod] = useState<"AM" | "PM">(initialPeriod);

  const updateDateTime = (
    newDate: Date | undefined,
    newHour: number,
    newMinute: number,
    newPeriod: "AM" | "PM"
  ) => {
    if (!newDate) {
      setSelectedDate(undefined);
      onSelect?.(undefined);
      return;
    }

    // Convert 12-hour to 24-hour format
    let hour24 = newHour;
    if (newPeriod === "PM" && newHour !== 12) {
      hour24 = newHour + 12;
    } else if (newPeriod === "AM" && newHour === 12) {
      hour24 = 0;
    }

    const updatedDate = new Date(newDate);
    updatedDate.setHours(hour24, newMinute, 0, 0);
    setSelectedDate(updatedDate);
    onSelect?.(updatedDate);
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined);
      onSelect?.(undefined);
      return;
    }

    updateDateTime(newDate, hour, minute, period);
  };

  const handleHourChange = (value: string) => {
    const newHour = parseInt(value, 10);
    setHour(newHour);
    if (selectedDate) {
      updateDateTime(selectedDate, newHour, minute, period);
    }
  };

  const handleMinuteChange = (value: string) => {
    const newMinute = parseInt(value, 10);
    setMinute(newMinute);
    if (selectedDate) {
      updateDateTime(selectedDate, hour, newMinute, period);
    }
  };

  const handlePeriodChange = (value: "AM" | "PM") => {
    setPeriod(value);
    if (selectedDate) {
      updateDateTime(selectedDate, hour, minute, value);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selectedDate}
          disabled={disabled}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon />
          {selectedDate ? (
            format(selectedDate, "PPP 'at' p")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
          <div className="border-t p-3">
            <Label htmlFor="time" className="text-sm font-medium">
              Time
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />

              {/* Hour Select */}
              <Select
                value={hour.toString()}
                onValueChange={handleHourChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground">:</span>

              {/* Minute Select */}
              <Select
                value={minute.toString()}
                onValueChange={handleMinuteChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM Select */}
              <Select
                value={period}
                onValueChange={handlePeriodChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="AM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
