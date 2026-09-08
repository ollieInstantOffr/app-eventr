import { publish } from "@/server/events";

/**
 * The per-event broadcast channel. Everything on it is safe for the audience
 * to see: counts, and winners already masked according to the event's
 * settings. Nothing personal goes on this channel.
 */
export function eventChannel(eventId: string): string {
  return `event:${eventId}`;
}

export type LiveMessage =
  | { type: "entry"; count: number }
  | { type: "status"; status: "PUBLISHED" | "CLOSED" | "COMPLETED" }
  | {
      type: "draw";
      prizeId: string;
      prizeName: string;
      prizeIndex: number;
      prizeTotal: number;
      winnerName: string;
      winnerDetail: string | null;
      entryNumber: number;
      pool: string[];
      drawnAt: string;
    }
  | { type: "redraw"; prizeId: string }
  | { type: "reset" };

export function publishLive(eventId: string, message: LiveMessage): void {
  publish(eventChannel(eventId), message);
}
