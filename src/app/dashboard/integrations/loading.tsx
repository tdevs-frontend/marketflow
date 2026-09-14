import {
  IntegrationCardGridSkeleton,
  IntegrationHeaderSkeleton,
  IntegrationKpiSkeleton,
  IntegrationToolbarSkeleton,
} from "@/components/integrations";

/** The hub: header, KPI strip, filter row, then the catalogue grid. */
export default function IntegrationsLoading() {
  return (
    <>
      <IntegrationHeaderSkeleton />
      <IntegrationKpiSkeleton />
      <IntegrationToolbarSkeleton />
      <IntegrationCardGridSkeleton count={6} />
    </>
  );
}
