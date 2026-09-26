"use client";

import { useMemo } from "react";

import { useToast } from "@/components/ui/toast";
import { PLANS } from "@/constants/pricing";
import { useAppDispatch } from "@/hooks/useRedux";
import { useAccount, useSubscription } from "@/lib/account-store";
import type { MerchantNotice, SupportActor } from "@/lib/support-service";
import { notify } from "@/redux/features/notification/notificationSlice";

/**
 * The signed-in merchant, as the support service sees them.
 *
 * Built from the session - the account and the subscription - so the ticket
 * form never asks for a workspace, an email or a plan the app already knows.
 * Memoised on those values, because the service's hooks memoise on the actor.
 */
export function useMerchantActor(): SupportActor & { kind: "merchant" } {
  const account = useAccount();
  const subscription = useSubscription();
  const planName = PLANS.find((plan) => plan.id === subscription.planId)?.name ?? "Growth";

  return useMemo(
    () => ({
      kind: "merchant",
      userId: account.id,
      workspaceId: account.workspaceId,
      name: `${account.firstName} ${account.lastName}`.trim() || account.email,
      email: account.email,
      planName,
    }),
    [account.id, account.workspaceId, account.firstName, account.lastName, account.email, planName],
  );
}

/**
 * Delivers what a support write raised.
 *
 * Merchant notifications go into the product's existing in-app feed - the
 * `notify` action on the notification slice, the same one the bell reads - so
 * a reply sent from the Admin Support Desk shows up in the merchant's bell.
 */
export function useSupportEffects() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  return {
    deliver(notices: MerchantNotice[]) {
      for (const notice of notices) dispatch(notify(notice));
    },
    toast,
  };
}
