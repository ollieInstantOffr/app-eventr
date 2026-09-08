import Link from "next/link";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Logo } from "@/components/ui/logo";

/** The centred frosted card the auth screens share (3a, 3b, 3c, 7a). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-screen">
      <AmbientBackground />
      <header className="relative px-6 py-6 sm:px-10">
        <Link href="/" aria-label="Eventr home">
          <Logo />
        </Link>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-5 pb-16">
        <div className="glass w-full max-w-[420px] p-8">{children}</div>
      </main>
    </div>
  );
}
