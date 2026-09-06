import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "WhatsApp" };

const FILTERS = ["Open", "Pending", "Resolved"];

export default function WhatsappPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="A shared team inbox for every WhatsApp Business conversation."
        action={<Button>New conversation</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Card className="flex flex-col p-3">
          <Input placeholder="Search conversations" aria-label="Search conversations" />

          <div className="mt-3 flex gap-1">
            {FILTERS.map((filter, index) => (
              <Button
                key={filter}
                variant={index === 0 ? "secondary" : "ghost"}
                size="sm"
                className="flex-1"
              >
                {filter}
              </Button>
            ))}
          </div>

          <p className="mt-6 px-3 pb-4 text-center text-sm text-text-muted">
            No conversations yet.
          </p>
        </Card>

        <Card className="p-4">
          <EmptyState
            title="Select a conversation"
            description="Connect a WhatsApp Business number to start receiving messages from your contacts."
            action={<Button size="sm">Connect number</Button>}
          />
        </Card>
      </div>
    </>
  );
}
