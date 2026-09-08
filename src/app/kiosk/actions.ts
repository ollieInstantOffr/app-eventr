"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pairKiosk } from "@/server/kiosk/session";

export type PairingState = { error?: string };

/** Screen 7g — the booth device types the six digits it was read out. */
export async function submitPairingCode(
  _state: PairingState,
  formData: FormData,
): Promise<PairingState> {
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Enter the six digits from the organiser's screen" };

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const result = await pairKiosk(code, ip);

  if (!result.ok) {
    return {
      error:
        result.reason === "rate-limited"
          ? "Too many attempts. Wait a few minutes and ask for a fresh code."
          : "That code isn't valid any more. Ask the organiser for a new one.",
    };
  }

  redirect(`/screen/${result.slug}/qr`);
}
