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
 * The merchant's local hour. Read through `useSyncExternalStore` because the
 * clock differs between the server pass and the client: the server snapshot
 * renders, the client swaps on hydration, and React reports no mismatch.
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
