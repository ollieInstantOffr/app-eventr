/**
 * The public screen keeps the eligible entry list in IndexedDB so a dropped
 * venue connection cannot stop a draw — screen 7f's rule. Everything cached
 * here is already masked for the audience; no raw personal data is stored on
 * the projector laptop or a kiosk device.
 */
const DB_NAME = "eventr-live";
const STORE = "pools";
const VERSION = 1;

export type CachedPool = {
  eventId: string;
  names: string[];
  entryNumbers: number[];
  savedAt: number;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "eventId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePool(pool: CachedPool): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(pool);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // A private window, or storage denied. The screen still works online.
  }
}

export async function loadPool(eventId: string): Promise<CachedPool | null> {
  try {
    const db = await open();
    const pool = await new Promise<CachedPool | null>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(eventId);
      request.onsuccess = () => resolve((request.result as CachedPool) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return pool;
  } catch {
    return null;
  }
}

/** Winners drawn offline, waiting to be reconciled when the link returns. */
const PENDING_KEY = "eventr:pending-draws";

export type PendingDraw = { prizeId: string; entryNumber: number; drawnAt: string };

export function readPendingDraws(): PendingDraw[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]") as PendingDraw[];
  } catch {
    return [];
  }
}

export function addPendingDraw(draw: PendingDraw): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify([...readPendingDraws(), draw]));
  } catch {
    // Storage blocked; the draw still happened on screen and the organiser
    // can record it from the winners tab.
  }
}

export function clearPendingDraws(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to do.
  }
}
