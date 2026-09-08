"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markPrizeDelivered, notifyOneWinner, redrawWinner } from "./actions";

export function WinnerRowActions({
  eventId,
  winnerId,
  prizeId,
  delivered,
  canRedraw,
}: {
  eventId: string;
  winnerId: string;
  prizeId: string;
  delivered: boolean;
  canRedraw: boolean;
}) {
  const [pending, start] = useTransition();
  const [confirmRedraw, setConfirmRedraw] = useState(false);

  if (confirmRedraw) {
    return (
      <div className="flex justify-end gap-1.5">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await redrawWinner(eventId, prizeId, "Claim window passed — winner did not collect");
              setConfirmRedraw(false);
            })
          }
        >
          Re-draw
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmRedraw(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-1.5">
      <Button
        variant={delivered ? "ghost" : "secondary"}
        size="sm"
        disabled={pending}
        onClick={() => start(() => markPrizeDelivered(eventId, winnerId, !delivered))}
      >
        {delivered ? "Delivered ✓" : "Mark delivered"}
      </Button>

      {!delivered ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(() => notifyOneWinner(eventId, winnerId))}
        >
          Notify
        </Button>
      ) : null}

      {canRedraw && !delivered ? (
        <Button variant="ghost" size="sm" onClick={() => setConfirmRedraw(true)}>
          Re-draw
        </Button>
      ) : null}
    </div>
  );
}
