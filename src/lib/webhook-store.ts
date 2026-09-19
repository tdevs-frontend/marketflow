"use client";

import { useSyncExternalStore } from "react";

import { WEBHOOKS } from "@/lib/integration-fixtures";
import type { Webhook } from "@/types/integration";

/**
 * The workspace's webhook endpoints, as one register.
 *
 * The same argument as `lib/api-key-store`, for the same reason. Two screens
 * list these — Integrations → Webhooks, which is the full surface with delivery
 * history and a detail drawer, and Settings → API & Developer, which is where
 * somebody looks when they are already in Settings. Both render the same
 * `WebhookTable` over these rows, so pausing an endpoint on one pauses it on
 * the other.
 *
 * An endpoint is a piece of live routing configuration: if the two screens kept
 * their own copies, one of them would say an endpoint is delivering while the
 * other says it is paused, and there would be no way to tell which is true
 * short of watching the downstream system.
 */

let snapshot: Webhook[] = WEBHOOKS;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Webhook[]) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function useWebhooks(): Webhook[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => WEBHOOKS,
  );
}

export function addWebhook(webhook: Webhook) {
  commit([webhook, ...snapshot]);
}

/** Patches one endpoint. The caller decides what changed; this owns the list. */
export function updateWebhook(id: string, patch: Partial<Webhook>) {
  commit(
    snapshot.map((webhook) =>
      webhook.id === id ? { ...webhook, ...patch } : webhook,
    ),
  );
}

/**
 * Deletes an endpoint.
 *
 * Unlike an API key, which is kept as a revoked row, a webhook is removed
 * outright — there is no credential here whose history anybody audits, and a
 * permanently listed dead endpoint is just a row that has to be explained to
 * every new developer.
 */
export function removeWebhook(id: string) {
  commit(snapshot.filter((webhook) => webhook.id !== id));
}
