"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked — the URL is on screen next to the button.
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
