"use client";

import { useRef } from "react";
import { Paperclip, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  MANUAL_PAYMENT_METHODS,
  PAYMENT_PROOF_RULES,
  type ManualPaymentMethod,
} from "@/constants/billing";
import { formatCurrency } from "@/lib/format";
import type { PaymentGateway } from "@/types/account";

import { ServiceNotice } from "../../service-notice";

/**
 * Step 3 — whatever the chosen method needs before it can be reviewed.
 *
 * Two branches, and they are genuinely different screens rather than one form
 * with fields hidden:
 *
 *   **Automatic** needs nothing from this application. The provider's own
 *   hosted checkout collects the instrument and hands back a token; a card
 *   number typed into a MarketFlow input would be card data this product never
 *   wanted and would be in scope for. So the automatic branch is a statement of
 *   where the merchant will be sent — or, when no provider is connected, a
 *   plain statement that they cannot be, which is the case in this build.
 *
 *   **Manual** needs everything, because there is no third party to ask. The
 *   reference, the date and the proof are what an administrator matches against
 *   a bank statement, and each field here exists because a verifier cannot do
 *   the job without it. Nothing is here for visual completeness.
 */

export interface ManualForm {
  method: ManualPaymentMethod;
  reference: string;
  paidAt: string;
  sender: string;
  note: string;
  proofName: string | null;
}

export const EMPTY_MANUAL_FORM: ManualForm = {
  method: "bank_transfer",
  reference: "",
  paidAt: "",
  sender: "",
  note: "",
  proofName: null,
};

export function PaymentDetails({
  gateway,
  amount,
  currency,
  form,
  onChange,
  errors,
  idBase,
}: {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  form: ManualForm;
  onChange: (patch: Partial<ManualForm>) => void;
  errors: Partial<Record<keyof ManualForm, string>>;
  idBase: string;
}) {
  if (gateway.kind === "automatic") {
    return <AutomaticDetails gateway={gateway} />;
  }

  return (
    <ManualDetails
      amount={amount}
      currency={currency}
      form={form}
      onChange={onChange}
      errors={errors}
      idBase={idBase}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Automatic                                                                  */
/* -------------------------------------------------------------------------- */

function AutomaticDetails({ gateway }: { gateway: PaymentGateway }) {
  if (!gateway.configured) {
    return (
      <ServiceNotice
        tone="unavailable"
        title={`${gateway.name} is not connected`}
      >
        {gateway.unavailableReason ??
          "Payment provider is not connected, so no payment can be taken through it."}{" "}
        Go back and choose manual payment to submit this by bank transfer
        instead.
      </ServiceNotice>
    );
  }

  return (
    <div className="space-y-4">
      <ServiceNotice tone="session" title={`Paying with ${gateway.name}`}>
        The next step opens {gateway.name}&rsquo;s secure checkout. Your card
        details are entered there and never reach MarketFlow.
      </ServiceNotice>

      <div className="flex items-start gap-3 rounded-panel border border-border bg-surface-secondary px-4 py-3.5">
        <ShieldCheck
          className="mt-0.5 size-4.5 shrink-0 text-success-text"
          aria-hidden
        />
        <p className="text-sm text-text-secondary">
          MarketFlow stores a token that identifies the card, not the number.
          You can remove it at any time from Payment method.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Manual                                                                     */
/* -------------------------------------------------------------------------- */

function ManualDetails({
  amount,
  currency,
  form,
  onChange,
  errors,
  idBase,
}: {
  amount: number;
  currency: string;
  form: ManualForm;
  onChange: (patch: Partial<ManualForm>) => void;
  errors: Partial<Record<keyof ManualForm, string>>;
  idBase: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const id = (field: string) => `${idBase}-${field}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment method" htmlFor={id("method")}>
          <Select
            id={id("method")}
            hideLabel
            label="Payment method"
            value={form.method}
            onChange={(method) => onChange({ method })}
            options={MANUAL_PAYMENT_METHODS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </Field>

        <Field
          label="Amount"
          htmlFor={id("amount")}
          hint="Set by the plan and the cycle you chose."
        >
          {/*
            Read-only rather than absent, and read-only rather than editable.
            The merchant has to see the figure they are meant to have sent — it
            is what they will check against their bank — but what the plan costs
            is the product's answer, not theirs. A typed amount that disagrees
            with the tier is a verification failure invented at the form.
          */}
          <Input
            id={id("amount")}
            readOnly
            value={formatCurrency(amount, currency)}
            className="bg-surface-secondary"
          />
        </Field>

        <Field
          label="Transaction reference"
          htmlFor={id("reference")}
          hint="The reference your bank shows for the transfer."
          error={errors.reference}
        >
          <Input
            id={id("reference")}
            value={form.reference}
            error={Boolean(errors.reference)}
            placeholder="e.g. FT26091400412"
            onChange={(event) => onChange({ reference: event.target.value })}
          />
        </Field>

        <Field
          label="Payment date"
          htmlFor={id("paidAt")}
          hint="The day the money left your account."
          error={errors.paidAt}
        >
          <Input
            id={id("paidAt")}
            type="date"
            value={form.paidAt}
            error={Boolean(errors.paidAt)}
            onChange={(event) => onChange({ paidAt: event.target.value })}
          />
        </Field>
      </div>

      <Field
        label="Sender account or name"
        htmlFor={id("sender")}
        hint="How the payment will appear on our statement. Optional, but it is what makes a transfer easy to match."
      >
        <Input
          id={id("sender")}
          value={form.sender}
          placeholder="e.g. Northwind Trading Ltd"
          onChange={(event) => onChange({ sender: event.target.value })}
        />
      </Field>

      <Field
        label="Payment proof"
        htmlFor={id("proof")}
        hint={PAYMENT_PROOF_RULES.label}
        error={errors.proofName}
      >
        {/* The input is the control and the button is its label — the same
            arrangement the avatar picker uses, so the two uploads in Settings
            keep one focus ring and one keyboard path. */}
        <input
          ref={fileInput}
          id={id("proof")}
          type="file"
          className="sr-only"
          accept={PAYMENT_PROOF_RULES.accept.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange({ proofName: file.name });
            /* Cleared so picking the same file twice still fires a change. */
            event.target.value = "";
          }}
        />

        {form.proofName ? (
          <div className="flex items-center gap-3 rounded-field border border-border-strong bg-surface px-3.5 py-2.5">
            <Paperclip className="size-4 shrink-0 text-text-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
              {form.proofName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ proofName: null })}
            >
              <X aria-hidden />
              Remove
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={() => fileInput.current?.click()}
          >
            <Paperclip aria-hidden />
            Upload receipt
          </Button>
        )}
      </Field>

      <Field
        label="Note for the reviewer"
        htmlFor={id("note")}
        hint="Anything that would help somebody match this payment. Optional."
      >
        <Textarea
          id={id("note")}
          value={form.note}
          rows={3}
          placeholder="e.g. Paid from the company account, reference shortened by the bank."
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </Field>
    </div>
  );
}
