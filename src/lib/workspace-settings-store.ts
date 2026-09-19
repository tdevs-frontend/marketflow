"use client";

import { useSyncExternalStore } from "react";

import { WORKSPACE_SETTINGS } from "@/lib/workspace-fixtures";
import type { SettingsSection, WorkspaceSettings } from "@/types/workspace";

/**
 * One record of how this workspace is configured, read by both screens that
 * show it.
 *
 * Settings → General and Workspace → Workspace Settings are two views of the
 * same configuration, aimed at two moments: General is where somebody goes
 * looking for "the workspace name" or "our timezone" with Settings already
 * open, and Workspace Settings is the full editor with branding, data retention
 * and the defaults that feed every module.
 *
 * Two *views* is fine. Two *copies* is not, and that was the previous state —
 * each screen held `useState(WORKSPACE_SETTINGS)`, so the same field could show
 * a different answer depending on which route you arrived from, with no way for
 * a merchant to tell which one was the truth. The fix is not to delete one
 * screen; it is for both to read and write one record.
 *
 * Session-scoped for the same reason `lib/account-store` is: there is no
 * backend, and a value that survived a reload would read as saved.
 */

let snapshot: WorkspaceSettings = WORKSPACE_SETTINGS;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hydration-safe: the server render and the first client read are one object. */
export function useWorkspaceSettings(): WorkspaceSettings {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => WORKSPACE_SETTINGS,
  );
}

/**
 * Writes one section.
 *
 * Section at a time rather than whole-record, because that is how both editors
 * save: a merchant editing Branding must not have their stale copy of Defaults
 * written back over somebody else's change to it.
 */
export function saveWorkspaceSection<S extends SettingsSection>(
  section: S,
  value: WorkspaceSettings[S],
) {
  snapshot = { ...snapshot, [section]: value };
  for (const listener of listeners) listener();
}
