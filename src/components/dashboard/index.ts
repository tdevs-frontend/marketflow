export * from "./stat-card";
export * from "./dashboard-range";
export * from "./overview-header";
export * from "./kpi-cards";
export * from "./growth-overview";
export * from "./sales-funnel";
export * from "./campaign-performance";
export * from "./whatsapp-inbox";
export * from "./recent-orders";
export * from "./automation-activity";
export * from "./plans-section";

/*
 * Not on the merchant overview any more, kept as library components:
 * `ChannelPerformance` and `GrowthInsight` were pulled from the dashboard to
 * keep it compact. Both still build and are ready to drop into
 * `/dashboard/analytics`, which is where channel-level reporting belongs.
 *
 * `BusinessPulse` and `ProductPerformance` came off the overview for the same
 * reason — the page reads better as three balanced rows than as eight
 * competing cards. Both are untouched and still build.
 */
export * from "./channel-performance";
export * from "./growth-insight";
export * from "./business-pulse";
export * from "./product-performance";
