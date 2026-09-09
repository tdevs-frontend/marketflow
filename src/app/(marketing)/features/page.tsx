import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything MarketFlow does across CRM, campaigns, automation, and analytics.",
};

const GROUPS = [
  {
    title: "CRM",
    items: [
      { icon: "users", title: "Contacts", body: "Custom fields, tags, and per-channel consent." },
      { icon: "target", title: "Leads", body: "Drag-and-drop pipelines with scoring and owners." },
    ],
  },
  {
    title: "Channels",
    items: [
      { icon: "message-circle", title: "WhatsApp", body: "Shared inbox, templates, and the 24-hour session window handled for you." },
      { icon: "mail", title: "Email", body: "Drag-and-drop builder with deliverability monitoring." },
      { icon: "smartphone", title: "SMS", body: "Two-way messaging with automatic opt-out handling." },
    ],
  },
  {
    title: "Scale",
    items: [
      { icon: "workflow", title: "Automation", body: "Branching journeys triggered by any customer signal." },
      { icon: "bar-chart", title: "Analytics", body: "Attribution across every channel and campaign." },
      { icon: "plug", title: "Integrations", body: "Sync with your store, forms, and data warehouse." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          One workspace for every customer conversation
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-text-secondary">
          Replace the stack of disconnected tools your team switches between all day.
        </p>
      </div>

      <div className="mt-14 space-y-12">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {group.title}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Card key={item.title} className="p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-btn bg-primary-soft text-primary">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.body}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <ButtonLink href={APP_ROUTES.register} size="lg">
          Start Free
        </ButtonLink>
      </div>
    </section>
  );
}
