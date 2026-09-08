"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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

function MenuIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M3 6h14M3 10h14M3 14h14"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M5 5l10 10M15 5L5 15"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
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
  );
}

/**
 * The organiser navigation. A full-height left column at desktop widths;
 * below `lg` there isn't room for that, so it becomes a slim top bar naming
 * the current section plus a hamburger that opens the same labelled nav as
 * an overlay sheet. An earlier version tried to fit the nav into a row of
 * bare icons — unreadable, and one of the icons (☰) reads as "open a menu"
 * to begin with, so it was actively misleading sitting next to a real menu
 * button doing something else.
 */
export function Sidebar({
  userName,
  organisationName,
}: {
  userName: string;
  organisationName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const current = NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  // Close on navigation, on Escape, and lock body scroll while the sheet is open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-field px-3 py-2.5 text-[13.5px] font-bold transition-colors",
              active ? "bg-violet text-white" : "text-ink-secondary hover:bg-black/5 hover:text-ink",
            )}
          >
            <span aria-hidden className="w-4 text-center text-[13px] opacity-80">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="flex flex-col gap-1.5">
      <Link
        href="/settings"
        className="flex items-center gap-2.5 rounded-field p-2 transition-colors hover:bg-black/5"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-violet-tint text-[12px] font-extrabold text-violet-deep"
        >
          {initials || "?"}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12.5px] font-bold">{userName}</span>
          <span className="block truncate text-[11px] text-ink-muted">{organisationName}</span>
        </span>
      </Link>

      <button
        type="button"
        disabled={signingOut}
        onClick={() => startSignOut(() => signOut())}
        className="flex items-center gap-2.5 rounded-field p-2 text-ink-muted transition-colors hover:bg-black/5 hover:text-danger disabled:opacity-50"
      >
        <SignOutIcon />
        <span className="text-[12.5px] font-bold">{signingOut ? "Signing out…" : "Sign out"}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile / tablet: a slim top bar naming where you are, plus a menu button. */}
      <div className="glass flex items-center gap-3 p-3 lg:hidden">
        <Link href="/events" aria-label="Eventr home" className="shrink-0">
          <Logo size="sm" showWordmark={false} />
        </Link>
        <p className="min-w-0 flex-1 truncate text-center text-[13.5px] font-bold text-ink">
          {current?.label ?? "Eventr"}
        </p>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-ink-secondary hover:bg-black/5"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* The menu itself, as a sheet over a dimmed backdrop — same treatment
          as every other overlay in the app, so it reads as "a menu opened"
          rather than a new page. */}
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="solid-panel absolute inset-x-4 top-4 flex max-h-[calc(100vh-2rem)] flex-col gap-6 overflow-y-auto p-5">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field text-ink-muted hover:bg-black/5"
              >
                <CloseIcon />
              </button>
            </div>

            {navList}

            <div className="border-t border-black/6 pt-4">{userBlock}</div>
          </div>
        </div>
      ) : null}

      {/* Desktop: the persistent left column. */}
      <aside className="glass sticky top-6 hidden h-[calc(100vh-3rem)] w-[212px] shrink-0 flex-col p-5 lg:flex">
        <Link href="/events" aria-label="Eventr home">
          <Logo />
        </Link>
        <div className="mt-8 flex-1">{navList}</div>
        <div className="mt-4">{userBlock}</div>
      </aside>
    </>
  );
}
