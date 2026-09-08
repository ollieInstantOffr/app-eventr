"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelSection } from "@/components/ui/glass-panel";
import { Toggle } from "@/components/ui/toggle";
import { fulfilErasure, fulfilExport, setAutoFulfilErasure } from "./actions";

type Request = {
  id: string;
  type: "EXPORT" | "ERASE";
  entryNumber: number | null;
  eventName: string;
  requestedAgo: string;
  dueIn: string;
};

/** Screen 4d's "Guest requests · 2 open". */
export function GuestRequestQueue({
  requests,
  autoFulfil,
}: {
  requests: Request[];
  autoFulfil: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [auto, setAuto] = useState(autoFulfil);
  const [pending, start] = useTransition();

  return (
    <PanelSection
      title="Guest requests"
      action={
        requests.length > 0 ? (
          <Badge tone="warn">{requests.length} open</Badge>
        ) : (
          <Badge tone="live">All clear</Badge>
        )
      }
    >
      {requests.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          Nothing waiting. Requests a guest makes from their confirmation page arrive here, with the
          30-day statutory clock already running.
        </p>
      ) : (
        <ul className="divide-y divide-black/6">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold">
                  {request.type === "ERASE" ? "Erase my data" : "Export my data"}
                  {request.entryNumber !== null ? ` — entry #${request.entryNumber}` : ""}
                </span>
                <span className="block text-[12px] text-ink-muted">
                  {request.eventName} · requested via confirmation page {request.requestedAgo} · due{" "}
                  {request.dueIn}
                </span>
              </span>

              <Button
                variant={request.type === "ERASE" ? "danger" : "secondary"}
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result =
                      request.type === "ERASE"
                        ? await fulfilErasure(request.id)
                        : await fulfilExport(request.id);
                    setMessage(result.message);
                  })
                }
              >
                {request.type === "ERASE" ? "Erase now" : "Send export"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 border-t border-black/6 pt-1">
        <Toggle
          checked={auto}
          onChange={(value) => {
            setAuto(value);
            start(() => setAutoFulfilErasure(value));
          }}
          label="Auto-fulfil erasure requests"
          description="Erase within 24 h without manual review, unless the entry is a winner with an undelivered prize."
        />
      </div>

      {message ? <p className="mt-3 text-[12.5px] font-semibold text-ink-secondary">{message}</p> : null}
    </PanelSection>
  );
}
