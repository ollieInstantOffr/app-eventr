import { cookies } from "next/headers";
import { authChannel, WAITING_CHANNEL_COOKIE } from "@/server/auth/magic-link";
import { sseResponse } from "@/server/events";

export const dynamic = "force-dynamic";

/**
 * The "check your inbox" tab holds this open. When the emailed link is opened
 * — in any tab, on this device — the auth route publishes to the channel and
 * this tab signs itself in (screen 7a).
 */
export async function GET() {
  const cookieStore = await cookies();
  const channelId = cookieStore.get(WAITING_CHANNEL_COOKIE)?.value;

  if (!channelId) {
    return new Response("No pending sign-in", { status: 400 });
  }

  return sseResponse(authChannel(channelId));
}
