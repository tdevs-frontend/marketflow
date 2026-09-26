"use client";

import { useMemo } from "react";

import { PLANS } from "@/constants/pricing";
import { useAccount, useSubscription } from "@/lib/account-store";
import type { MerchantActor } from "@/lib/support-service";

/**
 * The signed-in merchant, as the support service sees them.
 *
 * Built from the session - the account and the subscription - so the ticket
 * form never asks for a workspace, an email or a plan the app already knows.
 * Memoised on those values, because the service's hooks memoise on the actor.
 */
export function useMerchantActor(): MerchantActor {
  const account = useAccount();
  const subscription = useSubscription();
  const planName = PLANS.find((plan) => plan.id === subscription.planId)?.name ?? "Growth";

  return useMemo(
    () => ({
      userId: account.id,
      workspaceId: account.workspaceId,
      name: `${account.firstName} ${account.lastName}`.trim() || account.email,
      email: account.email,
      planName,
    }),
    [account.id, account.workspaceId, account.firstName, account.lastName, account.email, planName],
  );
}
