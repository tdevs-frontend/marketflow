export * from "./stat-card";
export * from "./overview-header";
export * from "./kpi-cards";
export * from "./growth-overview";
export * from "./sales-funnel";
export * from "./campaign-performance";
export * from "./whatsapp-inbox";
export * from "./product-performance";
export * from "./recent-orders";
export * from "./automation-activity";

/*
 * Not on the merchant overview any more, kept as library components:
 * `ChannelPerformance` and `GrowthInsight` were pulled from the dashboard to
 * keep it compact. Both still build and are ready to drop into
 * `/dashboard/analytics`, which is where channel-level reporting belongs.
 */
export * from "./channel-performance";
export * from "./growth-insight";
