"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { submitPairingCode, type PairingState } from "./actions";

const LENGTH = 6;

/** Six single-character boxes, as the mockup shows them. */
export function PairingForm() {
  const [state, action, pending] = useActionState<PairingState, FormData>(submitPairingCode, {});
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const hidden = useRef<HTMLInputElement>(null);

  function sync() {
    if (hidden.current) {
      hidden.current.value = inputs.current.map((input) => input?.value ?? "").join("");
    }
  }

  return (
    <form action={action} className="mt-6">
      <input ref={hidden} type="hidden" name="code" />

      <div className="flex justify-center gap-2">
        {Array.from({ length: LENGTH }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoFocus={index === 0}
            aria-label={`Digit ${index + 1}`}
            className="h-14 w-11 rounded-field border border-black/8 bg-white text-center text-[24px] font-extrabold tabular-nums focus:border-violet focus:outline-none"
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "");
              event.target.value = value;
              sync();
              if (value && index < LENGTH - 1) inputs.current[index + 1]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
                inputs.current[index - 1]?.focus();
              }
            }}
            onPaste={(event) => {
              // Pasting the whole code fills every box, which is what someone
              // reading it off a phone will do.
              const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
              if (!digits) return;
              event.preventDefault();
              digits.split("").forEach((digit, offset) => {
                const input = inputs.current[offset];
                if (input) input.value = digit;
              });
              sync();
              inputs.current[Math.min(digits.length, LENGTH - 1)]?.focus();
            }}
          />
        ))}
      </div>

      {state.error ? (
        <p className="mt-3 text-[12.5px] font-semibold text-danger">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
        {pending ? "Pairing…" : "Pair this device"}
      </Button>
    </form>
  );
}
