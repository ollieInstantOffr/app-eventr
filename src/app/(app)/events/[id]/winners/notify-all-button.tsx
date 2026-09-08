"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notifyAllWinners } from "./actions";

export function NotifyAllButton({ eventId }: { eventId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-3">
      {result ? <span className="text-[12.5px] font-bold text-teal-darker">{result}</span> : null}
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const { notified } = await notifyAllWinners(eventId);
            setResult(
              notified === 0 ? "Everyone was already notified" : `Notified ${notified} winner${notified === 1 ? "" : "s"}`,
            );
          })
        }
      >
        {pending ? "Sending…" : "Notify all winners"}
      </Button>
    </span>
  );
}
