"use client";

import { useSyncExternalStore } from "react";
import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { useAccount } from "@/lib/account-store";

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

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function OverviewHeader() {
  /* The same account record Settings edits, so a first name saved in Profile
     greets you here on the next visit. `auth.user` is `null` and always has
     been, which is why this said "Guest User" to the workspace owner. */
  const user = useAccount();
  const greeting = greetingFor(useLocalHour());

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[1.75rem]">
          {greeting}, {user.firstName || user.email} 👋
        </h1>
        <p className="mt-1.5 text-base text-text-secondary font-medium">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <ButtonLink
        href={APP_ROUTES.marketingCampaignNew}
        size="compact"
        className="shrink-0 max-sm:w-full"
      >
        <Plus aria-hidden />
        New Campaign
      </ButtonLink>
    </div>
  );
}
