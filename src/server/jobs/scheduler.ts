import "server-only";
import { prisma } from "@/server/db";
import { sweepRateLimiter } from "@/server/auth/rate-limit";
import { runAutoClose } from "@/server/jobs/auto-close";
import { runEntriesClosingReminders } from "@/server/jobs/reminders";
import { runRetention } from "@/server/jobs/retention";
import { runExpiries } from "@/server/jobs/expiries";
import { runGuestRequests } from "@/server/jobs/guest-requests";

const TICK_MS = 60_000;

type Job = { name: string; run: () => Promise<void> };

const JOBS: Job[] = [
  { name: "auto-close", run: runAutoClose },
  { name: "entries-closing-reminder", run: runEntriesClosingReminders },
  { name: "retention", run: runRetention },
  { name: "expiries", run: runExpiries },
  { name: "guest-requests", run: runGuestRequests },
];

/**
 * A Postgres advisory lock, so the jobs stay safe if Eventr is ever run with
 * more than one replica: only one of them holds the lock and does the work.
 */
const LOCK_KEY = 0x4556_4e54; // "EVNT"

async function withLock<T>(run: () => Promise<T>): Promise<T | null> {
  const [row] = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked
  `;
  if (!row?.locked) return null;

  try {
    return await run();
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${LOCK_KEY})`;
  }
}

async function tick(): Promise<void> {
  await withLock(async () => {
    for (const job of JOBS) {
      try {
        await job.run();
      } catch (error) {
        console.error(`[scheduler] ${job.name} failed:`, error);
      }
    }
  });

  sweepRateLimiter();
}

const globalForScheduler = globalThis as unknown as { eventrScheduler?: NodeJS.Timeout };

/**
 * Started from instrumentation.ts, inside the app container — the design's
 * time-based behaviour (reminders, auto-close, retention) shouldn't need a
 * second service in the compose stack.
 */
export function startScheduler(): void {
  if (globalForScheduler.eventrScheduler) return;

  globalForScheduler.eventrScheduler = setInterval(() => {
    void tick();
  }, TICK_MS);

  // Don't hold the process open on shutdown.
  globalForScheduler.eventrScheduler.unref?.();

  void tick();
}

/**
 * Records that a job ran for a particular window, so a restart mid-hour
 * cannot re-send a reminder or re-run a deletion pass.
 */
export async function once(job: string, key: string, run: () => Promise<void>): Promise<boolean> {
  const existing = await prisma.jobRun.findUnique({ where: { job_key: { job, key } } });
  if (existing) return false;

  try {
    await prisma.jobRun.create({ data: { job, key } });
  } catch {
    // Another replica claimed this window between the check and the insert.
    return false;
  }

  try {
    await run();
    await prisma.jobRun.update({
      where: { job_key: { job, key } },
      data: { finishedAt: new Date() },
    });
    return true;
  } catch (error) {
    await prisma.jobRun.update({
      where: { job_key: { job, key } },
      data: { finishedAt: new Date(), error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}
