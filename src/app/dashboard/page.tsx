import type { Metadata } from "next";

import { StatCardGrid } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { APP_ROUTES } from "@/constants";
import type { MetricSummary } from "@/types/analytics";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder figures — replace with `useGetOverviewQuery` once the API is live.
const METRICS: MetricSummary[] = [
  { key: "contacts", label: "Total contacts", value: 12480, previousValue: 11020, changePercent: 13.2, format: "number" },
  { key: "sent", label: "Messages sent", value: 84210, previousValue: 79800, changePercent: 5.5, format: "number" },
  { key: "openRate", label: "Open rate", value: 41.8, previousValue: 44.1, changePercent: -5.2, format: "percent" },
  { key: "revenue", label: "Attributed revenue", value: 92400, previousValue: 71300, changePercent: 29.6, format: "currency" },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your workspace across every channel."
        action={<ButtonLink href={APP_ROUTES.campaigns}>New campaign</ButtonLink>}
      />

      <StatCardGrid metrics={METRICS} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent campaigns"
            description="Sends from the last 30 days"
            action={
              <ButtonLink href={APP_ROUTES.campaigns} variant="ghost" size="sm">
                View all
              </ButtonLink>
            }
          />
          <CardBody>
            <EmptyState
              title="No campaigns yet"
              description="Create your first email, SMS, or WhatsApp campaign to see performance here."
              action={<ButtonLink href={APP_ROUTES.campaigns} size="sm">Create campaign</ButtonLink>}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Needs attention"
            description="Conversations waiting on a reply"
            action={
              <ButtonLink href={APP_ROUTES.whatsapp} variant="ghost" size="sm">
                Open inbox
              </ButtonLink>
            }
          />
          <CardBody>
            <EmptyState
              title="Inbox is clear"
              description="Incoming WhatsApp and SMS conversations that need a response will appear here."
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
