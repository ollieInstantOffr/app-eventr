import Link from "next/link";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { CookieConsent } from "@/components/marketing/cookie-consent";

/** The public site: landing page and legal documents share this chrome. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-screen">
      <AmbientBackground />

      <header className="relative mx-auto flex max-w-[1160px] items-center justify-between gap-6 px-6 py-6">
        <Link href="/" aria-label="Eventr home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 text-[13px] font-bold text-ink-secondary">
          <Link href="/#how" className="hidden rounded-field px-3 py-2 hover:text-ink sm:block">
            How it works
          </Link>
          <Link href="/#features" className="hidden rounded-field px-3 py-2 hover:text-ink sm:block">
            Features
          </Link>
          <Link href="/legal/privacy" className="hidden rounded-field px-3 py-2 hover:text-ink sm:block">
            Privacy
          </Link>
          <Link href="/login" className="rounded-field px-3 py-2 hover:text-ink">
            Log in
          </Link>
          <ButtonLink href="/register" size="sm" className="ml-1">
            Start free
          </ButtonLink>
        </nav>
      </header>

      {children}

      <footer className="relative mx-auto max-w-[1160px] border-t border-black/8 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo size="sm" />
          <nav className="flex flex-wrap gap-5 text-[12.5px] font-bold text-ink-muted">
            <Link href="/legal/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="hover:text-ink">
              Cookies
            </Link>
            <Link href="/legal/dpa" className="hover:text-ink">
              DPA
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-[11.5px] text-ink-faint">
          Eventr by instantoffr. Organisers run their own raffles and are responsible for their
          legality, prizes and guest consent.
        </p>
      </footer>

      <CookieConsent />
    </div>
  );
}
