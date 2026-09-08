import { EventEmitter } from "node:events";

/**
 * A tiny in-process pub/sub used by the two places the app pushes to a
 * browser: the sign-in waiting tab, and the live draw.
 *
 * This is deliberately in-memory. The app runs as a single container in the
 * compose stack, and the live screen keeps its own local cache of the entry
 * list so a dropped connection never stops a draw. If Eventr is ever run with
 * more than one replica, this needs to move behind Postgres LISTEN/NOTIFY —
 * everything else about the design already survives that change.
 */
type Channel = string;

const globalForBus = globalThis as unknown as { eventrBus?: EventEmitter };

const bus =
  globalForBus.eventrBus ??
  (() => {
    const emitter = new EventEmitter();
    // A busy draw fans out to the projector, the organiser preview and every
    // paired kiosk device at once.
    emitter.setMaxListeners(200);
    return emitter;
  })();

globalForBus.eventrBus = bus;

export function publish<T>(channel: Channel, payload: T): void {
  bus.emit(channel, payload);
}

export function subscribe<T>(channel: Channel, listener: (payload: T) => void): () => void {
  bus.on(channel, listener);
  return () => {
    bus.off(channel, listener);
  };
}

/**
 * Wraps a channel as an SSE response. Sends an immediate comment so the
 * browser settles the connection, then a heartbeat so proxies don't time it
 * out mid-event.
 */
export function sseResponse(channel: Channel, options?: { heartbeatMs?: number }): Response {
  const heartbeatMs = options?.heartbeatMs ?? 25_000;
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The client went away between the check and the write.
        }
      };

      write(": connected\n\n");

      unsubscribe = subscribe(channel, (payload) => {
        write(`data: ${JSON.stringify(payload)}\n\n`);
      });

      heartbeat = setInterval(() => write(": ping\n\n"), heartbeatMs);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
