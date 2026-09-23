"use client";

import { useSyncExternalStore } from "react";

import { API_KEYS } from "@/lib/integration-fixtures";
import type { ApiKey } from "@/types/integration";

/**
 * The workspace's API keys, as one register.
 *
 * Two screens list these: Integrations → API, which is the full developer
 * surface with usage and a request log, and Settings → API & Developer, which
 * is where somebody looks when they are already in Settings. Both render the
 * same `ApiKeyTable` over the same rows, so revoking a key on one is revoked on
 * the other - which is the only acceptable behaviour for a credential. A second
 * `useState(API_KEYS)` would mean a key that reads "Revoked" on one route and
 * "Active" on the other, and a developer choosing which page to believe.
 *
 * Keys only. Usage figures and the request log stay in `integration-fixtures`:
 * they are read-only telemetry, nothing mutates them, and a store for a
 * constant is indirection with no payer.
 *
 * The secret is never in here. `createApiKey` returns the plaintext exactly
 * once, to the dialog that shows it; from that moment only `masked` exists.
 */

let snapshot: ApiKey[] = API_KEYS;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: ApiKey[]) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function useApiKeys(): ApiKey[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => API_KEYS,
  );
}

/** Newest first, so a key created a moment ago is the row you are looking at. */
export function addApiKey(key: ApiKey) {
  commit([key, ...snapshot]);
}

/**
 * Revokes a key, keeping the row.
 *
 * Revoked keys are not deleted: "which key did we revoke in March, and when"
 * is a question somebody asks during an incident, and a row that vanishes
 * answers it with nothing.
 */
export function revokeApiKey(id: string) {
  commit(
    snapshot.map((key) =>
      key.id === id ? { ...key, status: "revoked" as const } : key,
    ),
  );
}
