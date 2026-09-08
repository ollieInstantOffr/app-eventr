import { redirect } from "next/navigation";

/** Branding lives with the organisation; the sidebar link points at it. */
export default function BrandingPage() {
  redirect("/settings/organisation");
}
