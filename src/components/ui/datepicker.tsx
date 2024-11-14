import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { format } from "date-fns";

type DatePickerWithRangeProps = {
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
};

export function DatePickerWithRange({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  className,
}: DatePickerWithRangeProps & React.HTMLAttributes<HTMLDivElement>) {
  const date: DateRange = {
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date.from}
            selected={date}
            onSelect={(range) => {
              const rangeFrom = range?.from ? String(range.from.toISOString().split("T")[0]) : '';
              const rangeTo = range?.to ? String(range.to.toISOString().split("T")[0]) : '';
              setStartDate(rangeFrom);
              setEndDate(rangeTo);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
