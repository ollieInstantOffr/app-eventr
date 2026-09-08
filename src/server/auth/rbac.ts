import "server-only";
import type { Role } from "@/generated/prisma";
import type { AuthenticatedSession } from "@/server/auth/session";

/**
 * What each role may do. The design is explicit about this (screen 7g):
 *
 *   Owner   everything, including billing, organisation deletion and the DPA
 *   Editor  create and run events, see all entries
 *   Viewer  events and entry counts only — no personal data
 *   Kiosk   the QR screen and the live draw, nothing else
 */
export const PERMISSIONS = {
  OWNER: [
    "event:read",
    "event:write",
    "event:delete",
    "entry:read",
    "entry:read-personal",
    "entry:export",
    "draw:run",
    "screen:view",
    "team:manage",
    "org:manage",
    "privacy:manage",
    "billing:manage",
  ],
  EDITOR: [
    "event:read",
    "event:write",
    "entry:read",
    "entry:read-personal",
    "entry:export",
    "draw:run",
    "screen:view",
  ],
  VIEWER: ["event:read", "entry:read", "screen:view"],
  KIOSK: ["screen:view"],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][number];

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[role] as readonly string[]).includes(permission);
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(session: AuthenticatedSession, permission: Permission): void {
  if (!can(session.role, permission)) throw new ForbiddenError(permission);
}

/**
 * A Viewer may see that an event has 248 entries but not who they are, so
 * personal data is removed here rather than merely hidden in the table.
 */
export function canSeePersonalData(role: Role): boolean {
  return can(role, "entry:read-personal");
}

/**
 * An invite can be limited to a single event. A membership scoped that way
 * must not reach any other event in the organisation.
 */
export function isEventInScope(session: AuthenticatedSession, eventId: string): boolean {
  const scope = session.membership.scopedEventId;
  return scope === null || scope === eventId;
}

export function assertEventInScope(session: AuthenticatedSession, eventId: string): void {
  if (!isEventInScope(session, eventId)) {
    throw new ForbiddenError("event:read");
  }
}
