"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";

const NAV = [
  { href: "/events", label: "Events", icon: "▦" },
  { href: "/entries", label: "Entries", icon: "☰" },
  { href: "/live", label: "Live draw", icon: "◉" },
  { href: "/branding", label: "Branding", icon: "◐" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

/** The glass sidebar every organiser screen shares. */
export function Sidebar({
  userName,
  organisationName,
}: {
  userName: string;
  organisationName: string;
}) {
  const pathname = usePathname();
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="glass sticky top-5 flex h-[calc(100vh-2.5rem)] w-[212px] shrink-0 flex-col p-5">
      <Link href="/events" aria-label="Eventr home">
        <Logo />
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-field px-3 py-2.5 text-[13.5px] font-bold transition-colors",
                active
                  ? "bg-violet text-white"
                  : "text-ink-secondary hover:bg-white/70 hover:text-ink",
              )}
            >
              <span aria-hidden className="text-[13px] opacity-80">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="mt-4 flex items-center gap-2.5 rounded-field p-2 transition-colors hover:bg-white/70"
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
    </aside>
  );
}
