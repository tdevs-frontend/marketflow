import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Automation" };

const RECIPES = [
  {
    icon: "users",
    title: "Welcome series",
    body: "Greet new contacts with a three-message onboarding sequence.",
  },
  {
    icon: "target",
    title: "Lead nurture",
    body: "Follow up automatically when a lead stalls in a pipeline stage.",
  },
  {
    icon: "message-circle",
    title: "Abandoned cart",
    body: "Send a WhatsApp reminder an hour after checkout is abandoned.",
  },
];

export default function AutomationPage() {
  return (
    <>
      <PageHeader
        title="Automation"
        description="Trigger multi-step journeys from any customer signal."
        action={<Button>New automation</Button>}
      />

      <EmptyState
        title="No automations yet"
        description="Start from a recipe below, or build a journey from scratch in the visual editor."
        action={<Button size="sm">Build from scratch</Button>}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Start from a recipe</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map((recipe) => (
            <Card key={recipe.title} className="p-5">
              <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary-soft text-primary">
                <Icon name={recipe.icon} className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{recipe.title}</h3>
              <p className="mt-1.5 text-sm text-text-secondary">{recipe.body}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Use recipe
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
