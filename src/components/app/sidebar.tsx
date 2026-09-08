"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { signOut } from "@/server/auth/actions";

const NAV = [
  { href: "/events", label: "Events", icon: "▦" },
  { href: "/entries", label: "Entries", icon: "☰" },
  { href: "/live", label: "Live draw", icon: "◉" },
  { href: "/branding", label: "Branding", icon: "◐" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

/**
 * The glass sidebar every organiser screen shares. A full-height left column
 * at desktop widths; below `lg` there isn't room for that, so it collapses
 * to a horizontal bar with a scrolling nav row instead of squeezing a fixed
 * 212px column beside the content.
 */
export function Sidebar({
  userName,
  organisationName,
}: {
  userName: string;
  organisationName: string;
}) {
  const pathname = usePathname();
  const [signingOut, startSignOut] = useTransition();

  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "glass flex shrink-0 items-center gap-3 p-3",
        "lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[212px] lg:flex-col lg:items-stretch lg:gap-0 lg:p-5",
      )}
    >
      <Link href="/events" aria-label="Eventr home" className="shrink-0">
        {/* Two wrapper spans, each carrying just one display utility — Logo
            sets its own `inline-flex` internally, and stacking a conflicting
            `hidden`/`flex` directly onto that via className is unreliable in
            Tailwind v4 (utility precedence follows scan order, not a fixed
            priority list), so the toggle lives on a plain wrapper instead. */}
        <span className="lg:hidden">
          <Logo size="sm" showWordmark={false} />
        </span>
        <span className="hidden lg:block">
          <Logo />
        </span>
      </Link>

      <nav
        className={cn(
          "flex min-w-0 flex-1 gap-1 overflow-x-auto",
          "lg:mt-8 lg:flex-col lg:overflow-visible",
        )}
      >
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-field px-3 py-2.5 text-[13.5px] font-bold whitespace-nowrap transition-colors",
                active
                  ? "bg-violet text-white"
                  : "text-ink-secondary hover:bg-black/5 hover:text-ink",
              )}
            >
              <span aria-hidden className="text-[13px] opacity-80">
                {item.icon}
              </span>
              <span className="hidden sm:inline lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1.5 lg:mt-4 lg:flex-col lg:items-stretch lg:gap-1.5">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-field p-2 transition-colors hover:bg-black/5 lg:w-full"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-violet-tint text-[12px] font-extrabold text-violet-deep"
          >
            {initials || "?"}
          </span>
          <span className="hidden min-w-0 leading-tight lg:block">
            <span className="block truncate text-[12.5px] font-bold">{userName}</span>
            <span className="block truncate text-[11px] text-ink-muted">{organisationName}</span>
          </span>
        </Link>

        <button
          type="button"
          disabled={signingOut}
          onClick={() => startSignOut(() => signOut())}
          title="Sign out"
          className={cn(
            "flex shrink-0 items-center justify-center gap-2.5 rounded-field p-2 text-ink-muted transition-colors hover:bg-black/5 hover:text-danger disabled:opacity-50",
            "lg:w-full lg:justify-start",
          )}
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M13 13l3.5-3.5L13 6M16 9.5H7.5"
            />
          </svg>
          <span className="hidden text-[12.5px] font-bold lg:inline">
            {signingOut ? "Signing out…" : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
