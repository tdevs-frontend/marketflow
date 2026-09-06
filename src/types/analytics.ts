export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from?: string;
  to?: string;
}

export interface MetricPoint {
  date: string;
  value: number;
}

export interface MetricSummary {
  key: string;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number;
  format: "number" | "currency" | "percent" | "duration";
  series?: MetricPoint[];
}

export interface ChannelPerformance {
  channel: "email" | "sms" | "whatsapp";
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  conversionRate: number;
  revenue: number;
}

export interface FunnelStep {
  label: string;
  count: number;
  conversionRate: number;
}

export interface AnalyticsOverview {
  summaries: MetricSummary[];
  channels: ChannelPerformance[];
  funnel: FunnelStep[];
  revenueSeries: MetricPoint[];
}

export interface AnalyticsQuery {
  range: DateRange;
  channel?: "email" | "sms" | "whatsapp";
  campaignId?: string;
}
