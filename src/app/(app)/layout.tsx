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
      <div className="relative mx-auto flex max-w-[1400px] gap-6 p-5">
        <Sidebar userName={userName} organisationName={session.membership.organisation.name} />
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
