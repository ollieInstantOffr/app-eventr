"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/organisation", label: "Organisation" },
  { href: "/settings/privacy", label: "Privacy & data" },
  { href: "/settings/team", label: "Team" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={cn(
            "rounded-field px-3.5 py-2 text-[13px] font-bold transition-colors",
            pathname === tab.href
              ? "bg-violet text-white"
              : "text-ink-secondary hover:bg-white/70 hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
