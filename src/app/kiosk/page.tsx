import { redirect } from "next/navigation";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Logo } from "@/components/ui/logo";
import { getKioskContext } from "@/server/kiosk/session";
import { PairingForm } from "./pairing-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booth screen", robots: { index: false } };

/** Screen 7g, right — what the booth device shows before it is paired. */
export default async function KioskPage() {
  const kiosk = await getKioskContext();
  if (kiosk) redirect(`/screen/${kiosk.slug}/qr`);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-screen px-6">
      <AmbientBackground />

      <div className="glass relative w-full max-w-[420px] p-8 text-center">
        <Logo className="justify-center" />

        <h1 className="mt-6 text-[24px] font-extrabold">Enter the pairing code</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
          Ask the organiser for the 6-digit code shown in their Live draw settings.
        </p>

        <PairingForm />

        <p className="mt-5 text-[12px] leading-relaxed text-ink-muted">
          This device will only show the QR page and the live draw.
        </p>
      </div>
    </div>
  );
}
