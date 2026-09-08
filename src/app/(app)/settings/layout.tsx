import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SettingsTabs } from "./settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <header className="px-1">
        <p className="text-[12.5px] font-bold text-ink-muted">
          <Link href="/events" className="hover:text-violet">
            Events
          </Link>{" "}
          / Settings
        </p>
        <h1 className="mt-0.5 text-[28px] font-extrabold">Settings</h1>
      </header>

      <GlassPanel className="p-2">
        <SettingsTabs />
      </GlassPanel>

      {children}
    </div>
  );
}
