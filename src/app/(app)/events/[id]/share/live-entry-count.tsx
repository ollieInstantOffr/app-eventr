"use client";

import { useEffect, useState } from "react";

/** The "Live right now" counter, kept current over SSE. */
export function LiveEntryCount({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const source = new EventSource(`/api/live/${slug}/stream`);

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type?: string; count?: number };
        if (message.type === "entry" && typeof message.count === "number") {
          setCount(message.count);
        }
      } catch {
        // Heartbeat.
      }
    };

    return () => source.close();
  }, [slug]);

  return (
    <p className="text-[40px] font-extrabold leading-none tabular-nums">
      {new Intl.NumberFormat("en-GB").format(count)}
    </p>
  );
}
