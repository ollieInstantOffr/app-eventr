"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { TimePicker } from "@/components/ui/time-picker";

/** Live demo of the two custom pickers, since they're controlled components. */
export function DateTimeDemo() {
  const [date, setDate] = useState<string | null>("2026-09-24");
  const [time, setTime] = useState<string | null>("16:00");

  return (
    <>
      <Field label="Date" htmlFor="sg-date">
        <DatePicker id="sg-date" value={date} onChange={setDate} />
      </Field>
      <Field label="Entries close" htmlFor="sg-close" hint="Local time">
        <TimePicker id="sg-close" value={time} onChange={setTime} />
      </Field>
    </>
  );
}
