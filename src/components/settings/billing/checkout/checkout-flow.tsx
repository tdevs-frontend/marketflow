"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { planPrice, type Plan } from "@/constants/pricing";
import {
  listPaymentGateways,
  payForPlan,
  submitManualPayment,
} from "@/lib/account-service";
import { useSubscription } from "@/lib/account-store";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  BillingPeriod,
  PaymentRequest,
  Subscription,
} from "@/types/account";

import { useServiceQuery } from "../../settings-section";
import { CheckoutReview } from "./checkout-review";
import {
  EMPTY_MANUAL_FORM,
  PaymentDetails,
  type ManualForm,
} from "./payment-details";
import { PaymentMethodSelector } from "./payment-method-selector";
import {
  PaymentFailure,
  PaymentPending,
  PaymentSuccess,
} from "./payment-result";
import { PlanSummary } from "./plan-summary";

/**
 * Plan → method → details → review → result, in a modal over the pricing tab.
 *
 * A modal rather than a route, and the reason is what sits behind it. The
 * merchant chose a tier by comparing four cards; a full-page checkout replaces
 * that comparison with a form and makes "actually, what did Business include?"
 * a navigation problem. `Dialog` is the product's own - native `<dialog>`,
 * focus trap, Escape, `::backdrop` - so nothing here re-implements modality.
 *
 * The step is local state and deliberately *not* in the URL. The draft it
 * carries - a chosen method, a typed reference, an attached receipt - cannot be
 * reconstructed from a query string, so a shareable step-4 link would open on a
 * review of nothing. The tab underneath stays addressable; the transaction on
 * top of it does not.
 *
 * What this component owns is the order of the steps and the one decision at
 * each boundary: whether the current step is complete enough to leave. What it
 * does not own is any of the five screens, which is why each is its own file -
 * and none of them knows it is in a checkout.
 */

type Step = "plan" | "method" | "details" | "review" | "result";

const STEPS: { id: Step; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "method", label: "Payment method" },
  { id: "details", label: "Payment details" },
  { id: "review", label: "Review" },
];

/** What the result screen is showing. `null` until the transaction settles. */
type Outcome =
  | { kind: "success"; subscription: Subscription }
  | { kind: "pending"; request: PaymentRequest }
  | { kind: "failure"; message: string };

export function CheckoutFlow({
  plan,
  initialPeriod,
  open,
  onClose,
  onViewBilling,
}: {
  plan: Plan;
  initialPeriod: BillingPeriod;
  open: boolean;
  onClose: () => void;
  /**
   * Where the result screen's button goes.
   *
   * Closing onto the pricing grid would leave a merchant who has just
   * submitted a payment looking at the tier they did *not* get, with the
   * record of what they did do one tab away and unmentioned. The outcome
   * lives on Billing Information, so the button that says "View billing"
   * takes them there.
   */
  onViewBilling: () => void;
}) {
  const idBase = useId();
  const subscription = useSubscription();

  const [step, setStep] = useState<Step>("plan");
  const [period, setPeriod] = useState<BillingPeriod>(initialPeriod);
  const [gatewayId, setGatewayId] = useState<string | null>(null);
  const [form, setForm] = useState<ManualForm>(EMPTY_MANUAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ManualForm, string>>>(
    {},
  );
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);

  const loadGateways = useCallback(() => listPaymentGateways(), []);
  const { state: gatewayState } = useServiceQuery(loadGateways);
  const gateways = useMemo(() => gatewayState.data ?? [], [gatewayState.data]);

  const gateway = gateways.find((item) => item.id === gatewayId) ?? null;
  const amount = planPrice(plan, period) ?? 0;
  const currency = subscription.currency;

  const patchForm = (patch: Partial<ManualForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    /* Clearing the touched field's error as it is retyped, rather than on the
       next submit: an error that survives the correction reads as a field that
       will not accept anything. */
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch) as (keyof ManualForm)[]) {
        delete next[key];
      }
      return next;
    });
  };

  /* ---------------------------------------------------------------------- */

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  /** Whether the current step has what it needs to be left. */
  const canAdvance = (): boolean => {
    if (step === "plan") return amount > 0;
    if (step === "method") return gateway !== null;
    if (step === "details") {
      if (!gateway) return false;
      /* An unconfigured provider is a wall, not a validation failure. There is
         nothing the merchant can type that would make it work, so the step
         explains and the button stays off. */
      if (gateway.kind === "automatic") return gateway.configured;
      return true;
    }
    return true;
  };

  const validateManual = (): boolean => {
    const next: Partial<Record<keyof ManualForm, string>> = {};
    if (!form.reference.trim()) {
      next.reference = "Enter the reference your bank gave the transfer.";
    }
    if (!form.paidAt) next.paidAt = "Enter the date the payment was sent.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === "details" && gateway?.kind === "manual" && !validateManual()) {
      return;
    }
    const next = STEPS[stepIndex + 1];
    setStep(next ? next.id : "review");
  };

  const goBack = () => {
    const previous = STEPS[stepIndex - 1];
    if (previous) setStep(previous.id);
  };

  /*
   * The transaction, and the only place this component talks to the service.
   *
   * The result is read straight off the returned `ServiceResult` rather than
   * out of a save-state hook: the failure screen shows the provider's own
   * sentence, and a hook's `message` is one render behind the call that set it.
   * The outcome and the step move together, so the result screen can never be
   * reached without something to report on it.
   */
  const settle = async () => {
    if (!gateway) return;
    setBusy(true);

    const result =
      gateway.kind === "manual"
        ? await submitManualPayment({
            planId: plan.id,
            period,
            amount,
            currency,
            method: form.method,
            reference: form.reference,
            paidAt: form.paidAt,
            sender: form.sender,
            note: form.note,
            proofName: form.proofName,
          })
        : await payForPlan(plan.id, period, gateway.id);

    setBusy(false);

    if (!result.ok) {
      setOutcome({ kind: "failure", message: result.error.message });
    } else if (gateway.kind === "manual") {
      setOutcome({ kind: "pending", request: result.data as PaymentRequest });
    } else {
      setOutcome({ kind: "success", subscription: result.data as Subscription });
    }

    setStep("result");
  };

  /** Back to the method step with the plan intact - §12's "change method". */
  const retry = (target: Step) => {
    setOutcome(null);
    setStep(target);
  };

  /* ---------------------------------------------------------------------- */

  const title =
    step === "result"
      ? "Payment"
      : `Change to ${plan.name}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={title}
      description={
        step === "result"
          ? undefined
          : "Choose the cycle, how you want to pay, and confirm before anything is charged."
      }
      footer={
        <Footer
          step={step}
          outcome={outcome}
          busy={busy}
          canAdvance={canAdvance()}
          amount={amount}
          currency={currency}
          manual={gateway?.kind === "manual"}
          onBack={goBack}
          onNext={goNext}
          onSettle={() => void settle()}
          onRetry={retry}
          onClose={onClose}
          onViewBilling={() => {
            onClose();
            onViewBilling();
          }}
        />
      }
    >
      {step === "result" ? null : <Steps current={step} />}

      <div className={step === "result" ? undefined : "mt-5"}>
        {step === "plan" ? (
          <PlanSummary
            plan={plan}
            period={period}
            onPeriodChange={setPeriod}
            currency={currency}
          />
        ) : null}

        {step === "method" ? (
          <PaymentMethodSelector
            gateways={gateways}
            value={gatewayId}
            onChange={setGatewayId}
            name={`${idBase}-gateway`}
            loading={gatewayState.status === "loading"}
          />
        ) : null}

        {step === "details" && gateway ? (
          <PaymentDetails
            gateway={gateway}
            amount={amount}
            currency={currency}
            form={form}
            onChange={patchForm}
            errors={errors}
            idBase={`${idBase}-manual`}
          />
        ) : null}

        {step === "review" && gateway ? (
          <CheckoutReview
            plan={plan}
            period={period}
            amount={amount}
            currency={currency}
            gateway={gateway}
            manual={gateway.kind === "manual" ? form : undefined}
          />
        ) : null}

        {step === "result" && outcome ? (
          outcome.kind === "success" ? (
            <PaymentSuccess
              subscription={outcome.subscription}
              planName={plan.name}
            />
          ) : outcome.kind === "pending" ? (
            <PaymentPending request={outcome.request} />
          ) : (
            <PaymentFailure message={outcome.message} planName={plan.name} />
          )
        ) : null}
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Step rail                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Where you are in four steps.
 *
 * Numbers and labels rather than a progress bar: a bar answers "how far" and
 * the question at a checkout is "what is still going to be asked of me". Built
 * from the same pill-and-chevron vocabulary as the workflow wizard's rail, so
 * the two multi-step flows in the product read as one pattern.
 *
 * An `<ol>`, because the steps are ordered and a screen reader should say so.
 */
function Steps({ current }: { current: Step }) {
  const index = STEPS.findIndex((item) => item.id === current);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {STEPS.map((item, position) => {
        const active = item.id === current;
        const done = position < index;

        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                active
                  ? "border-primary bg-primary-soft text-primary-dark"
                  : done
                    ? "border-border bg-surface text-text-secondary"
                    : "border-border bg-surface text-text-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-xs font-medium tabular-nums",
                  active || done
                    ? "bg-primary text-white"
                    : "bg-surface-secondary text-text-muted",
                )}
              >
                {position + 1}
              </span>
              {item.label}
            </span>

            {position < STEPS.length - 1 ? (
              <ChevronRight className="size-5 text-text-muted" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The controls, and the one place the final button stops saying "Continue".
 *
 * A generic Continue at the last step is how somebody pays without registering
 * that they did. So the review's button names the act and, for a charge, the
 * amount: "Pay $49" or "Submit payment". The difference between those two is
 * also the difference between the two outcomes they lead to, which is exactly
 * what the merchant should be deciding on.
 */
function Footer({
  step,
  outcome,
  busy,
  canAdvance,
  amount,
  currency,
  manual,
  onBack,
  onNext,
  onSettle,
  onRetry,
  onClose,
  onViewBilling,
}: {
  step: Step;
  outcome: Outcome | null;
  busy: boolean;
  canAdvance: boolean;
  amount: number;
  currency: string;
  manual: boolean;
  onBack: () => void;
  onNext: () => void;
  onSettle: () => void;
  onRetry: (step: Step) => void;
  onClose: () => void;
  onViewBilling: () => void;
}) {
  if (step === "result") {
    if (outcome?.kind === "failure") {
      return (
        <>
          <Button variant="outline" onClick={() => onRetry("method")}>
            Change payment method
          </Button>
          <Button onClick={() => onRetry("review")}>Try again</Button>
        </>
      );
    }

    return <Button onClick={onViewBilling}>View billing</Button>;
  }

  return (
    <>
      {step === "plan" ? (
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      ) : (
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
      )}

      {step === "review" ? (
        <Button onClick={onSettle} disabled={busy} aria-busy={busy || undefined}>
          {busy
            ? "Working…"
            : manual
              ? "Submit payment"
              : `Pay ${formatCurrency(amount, currency)}`}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canAdvance || busy}>
          Continue
        </Button>
      )}
    </>
  );
}
