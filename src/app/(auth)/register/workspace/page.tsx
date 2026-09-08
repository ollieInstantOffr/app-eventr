import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { WorkspaceForm } from "./workspace-form";

export const metadata = { title: "Your workspace" };

export default async function WorkspacePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Someone who already has an organisation doesn't need this step.
  if (session.membership) redirect("/events");

  return (
    <>
      <p className="text-[12px] font-bold tracking-wide text-ink-muted uppercase">Step 2 of 2</p>
      <h1 className="mt-1.5 text-[26px] font-extrabold">Your workspace</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
        Your logo goes on the QR poster, guests&rsquo; phones and the live screen. You can change it
        later, and any event can override it.
      </p>
      <WorkspaceForm />
    </>
  );
}
