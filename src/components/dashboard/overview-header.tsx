"use client";

import { useSyncExternalStore } from "react";
import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The greeting never needs to tick, so nothing ever calls the listener. */
const subscribe = () => () => {};

/**
 * The merchant's local hour.
 *
 * Read through `useSyncExternalStore` rather than at render: the clock is a
 * browser value, and the server pass has a different one. This is the API for
 * exactly that split — the server snapshot renders, the client swaps to its own
 * on hydration, and React never reports a mismatch. Reading `new Date()`
 * inline would prerender the build machine's hour and freeze it there.
 */
function useLocalHour(): number {
  return useSyncExternalStore(
    subscribe,
    () => new Date().getHours(),
    /* Server snapshot — morning, matching the static prerender. */
    () => 9,
  );
}

export function OverviewHeader() {
  const { user } = useAuth();
  const greeting = greetingFor(useLocalHour());

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl">
          {greeting}, {user?.name ?? "Guest User"} 👋
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here&apos;s what&apos;s happening with your marketing today.
        </p>
      </div>

      <ButtonLink
        href={APP_ROUTES.campaigns}
        size="compact"
        className="shrink-0 max-sm:w-full"
      >
        <Plus aria-hidden />
        New Campaign
      </ButtonLink>
    </div>
  );
}
