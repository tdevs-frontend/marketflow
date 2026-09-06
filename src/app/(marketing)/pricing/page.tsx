import type { Metadata } from "next";
import { Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple per-workspace pricing that scales with your contact list.",
};

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    cadence: "forever",
    description: "For solo marketers validating their first funnel.",
    features: ["1,000 contacts", "Email campaigns", "1 WhatsApp number", "Basic analytics"],
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    cadence: "per month",
    description: "For teams running multi-channel campaigns every week.",
    features: [
      "25,000 contacts",
      "Email, SMS & WhatsApp",
      "Visual automation builder",
      "Shared team inbox",
      "Advanced analytics",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    description: "For organisations with compliance and volume requirements.",
    features: [
      "Unlimited contacts",
      "Dedicated infrastructure",
      "SSO & audit logs",
      "Priority support",
    ],
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pricing that grows with your list
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-text-secondary">
          Every plan includes the CRM, unlimited team members, and no per-send fees.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn("flex flex-col p-6", plan.featured && "ring-2 ring-primary")}
          >
            <h2 className="text-sm font-semibold">{plan.name}</h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-sm text-text-muted">
                {plan.cadence}
              </span>
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              {plan.description}
            </p>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <ButtonLink
              href={APP_ROUTES.register}
              variant={plan.featured ? "primary" : "outline"}
              className="mt-6 w-full"
            >
              {plan.price === "Custom" ? "Contact sales" : "Get started"}
            </ButtonLink>
          </Card>
        ))}
      </div>
    </section>
  );
}
