export * from "./chart-theme";
export * from "./apex-chart";
export * from "./growth-overview-chart";

/*
 * Not on the merchant overview any more, kept as library components.
 *
 * `SparklineChart` came off the KPI cards, and `CampaignPerformanceChart` and
 * `ProductRevenueChart` came off their sections when both became ranked rows —
 * a row carries the name, the measure, its share of the leader and the rate it
 * converted at in the height a plot spends on one of those. All three still
 * build and are ready for `/dashboard/analytics`, where a plot has the width to
 * earn its place.
 */
export * from "./sparkline-chart";
export * from "./campaign-performance-chart";
export * from "./product-revenue-chart";

/* Used by `ChannelPerformance`, which is no longer on the overview page. */
export * from "./channel-performance-chart";

/* Added with the marketing modules — generic over colour and value format, so
   every channel gets the same chart in its own accent. */
export * from "./trend-chart";
export * from "./bars-chart";
export * from "./donut-chart";
