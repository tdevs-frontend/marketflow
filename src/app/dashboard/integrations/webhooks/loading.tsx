import {
  IntegrationHeaderSkeleton,
  IntegrationKpiSkeleton,
  IntegrationToolbarSkeleton,
  WebhookTableSkeleton,
} from "@/components/integrations";

/** Header, KPI strip, then the toolbar and endpoint table inside one card. */
export default function WebhooksLoading() {
  return (
    <>
      <IntegrationHeaderSkeleton />
      <IntegrationKpiSkeleton />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <IntegrationToolbarSkeleton />
        <div className="mt-5">
          <WebhookTableSkeleton rows={4} />
        </div>
      </div>
    </>
  );
}
