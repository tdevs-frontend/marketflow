/**
 * Commerce's KPI strip, which is `ui/kpi-strip` under its original names.
 *
 * Kept as a re-export rather than deleted so the eleven Commerce call sites
 * are untouched — the same shape `commerce/filter-bar` already uses for
 * `ui/filter-bar`.
 */
export { KpiStrip as CommerceKpis, type Kpi as CommerceKpi } from "@/components/ui/kpi-strip";
