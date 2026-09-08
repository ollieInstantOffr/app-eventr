/**
 * Next runs this once per server process. The scheduler lives inside the app
 * container so the compose stack doesn't need a second service just to send a
 * reminder and apply retention.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startScheduler } = await import("@/server/jobs/scheduler");
  startScheduler();
}
