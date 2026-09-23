"use client";

import { useSyncExternalStore } from "react";

import { WORKSPACE_AUDIT } from "@/lib/workspace-fixtures";
import type { RoleActivityEvent, WorkspaceAuditEvent } from "@/types/workspace";

/**
 * Audit events recorded during this session.
 *
 * Roles & Permissions and Workspace Activity are separate routes, so a role
 * edit on one has to reach the other through something outside React's tree.
 * This is that something: a module-level list plus a subscription, read through
 * `useSyncExternalStore` so both pages re-render when it changes.
 *
 * It stands in for exactly one thing a backend would do - persist the event and
 * serve it back on the next request. Replacing this with `POST /audit` and a
 * refetch is the whole migration; nothing above it knows the difference.
 *
 * Deliberately not Redux. The store in this app holds auth, workspace identity
 * and UI chrome - durable, cross-cutting state. A demo-session audit buffer is
 * neither, and putting it there would imply it survives a reload, which it does
 * not.
 */

let sessionEvents: WorkspaceAuditEvent[] = [];
let sessionRoleEvents: RoleActivityEvent[] = [];

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The merged trail: this session's events first, then the fixture's.
 *
 * Cached rather than rebuilt per call - `useSyncExternalStore` compares the
 * snapshot by identity, and a fresh array every time is an infinite re-render.
 */
let mergedCache: WorkspaceAuditEvent[] = WORKSPACE_AUDIT;

function rebuild() {
  mergedCache = [...sessionEvents, ...WORKSPACE_AUDIT];
  emit();
}

export function recordAuditEvent(event: WorkspaceAuditEvent) {
  sessionEvents = [event, ...sessionEvents];
  rebuild();
}

export function recordRoleEvent(event: RoleActivityEvent) {
  sessionRoleEvents = [event, ...sessionRoleEvents];
  emit();
}

/** The audit trail as the Activity page should show it right now. */
export function useWorkspaceAudit(): WorkspaceAuditEvent[] {
  return useSyncExternalStore(
    subscribe,
    () => mergedCache,
    /* The server render sees the fixture alone - a session buffer does not
       exist there, and returning the same value both sides is what keeps
       hydration quiet. */
    () => WORKSPACE_AUDIT,
  );
}

/** This session's role-history rows for one role, newest first. */
export function useSessionRoleEvents(roleId: string): RoleActivityEvent[] {
  const all = useSyncExternalStore(
    subscribe,
    () => sessionRoleEvents,
    () => EMPTY,
  );

  return all.filter((event) => event.roleId === roleId);
}

/** Stable empty array, for the same identity reason as `mergedCache`. */
const EMPTY: RoleActivityEvent[] = [];
