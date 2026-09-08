"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { loadDemoData } from "@/server/events/mutations";

/** "Load demo" from screen 7e. */
export function LoadDemoButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      className="mt-3"
      disabled={pending}
      onClick={() => start(() => loadDemoData())}
    >
      {pending ? "Building the demo…" : "Load demo"}
    </Button>
  );
}
