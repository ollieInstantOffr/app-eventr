import { AmbientBackground } from "@/components/ui/ambient-background";

/**
 * The guest phone page frame: the organiser's logo at the top, their
 * background colour, and the Eventr credit at the bottom. Deliberately light —
 * this loads on a venue's Wi-Fi on someone's phone.
 */
export function GuestShell({
  logoUrl,
  organisationName,
  backgroundColour,
  footer,
  children,
}: {
  logoUrl: string | null;
  organisationName: string;
  backgroundColour: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center px-5 py-8"
      style={{ background: backgroundColour }}
    >
      <AmbientBackground />

      <header className="relative mb-5 flex h-11 items-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={organisationName} className="max-h-11 max-w-[220px]" />
        ) : (
          <span className="text-[17px] font-extrabold">{organisationName}</span>
        )}
      </header>

      <main className="glass relative w-full max-w-[420px] p-6">{children}</main>

      <footer className="relative mt-5 text-center text-[11.5px] text-ink-muted">
        {footer ?? <>Powered by Eventr by instantoffr</>}
      </footer>
    </div>
  );
}
