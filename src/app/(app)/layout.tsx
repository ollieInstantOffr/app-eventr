import { AmbientBackground } from "@/components/ui/ambient-background";
import { Sidebar } from "@/components/app/sidebar";
import { requireSession } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const userName =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.email;

  return (
    <div className="relative min-h-screen bg-screen">
      <AmbientBackground />
      {/* 1600px only caps things on genuinely ultra-wide monitors; on an
          ordinary laptop or desktop screen the layout uses the full width,
          just with breathing room at the edges that scales with viewport. */}
      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:flex-row lg:px-8">
        <Sidebar userName={userName} organisationName={session.membership.organisation.name} />
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
