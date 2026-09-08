/*
 * The dashboard Marketing module.
 *
 * Named `marketing-hub` because `components/marketing` was already taken by
 * the public landing-page sections rendered under the `(marketing)` route
 * group — different audience, different components, same obvious name.
 */
export * from "./campaign-status";
export * from "./marketing-stats";
export * from "./channel-performance-chart";
export * from "./campaign-table";
export * from "./marketing-overview";
export * from "./campaigns-workspace";
export * from "./campaign-wizard";

/* Cross-channel pieces. Every channel module composes from these. */
export * from "./shared/channel-badge";
export * from "./shared/conversion-funnel";
export * from "./shared/activity-feed";
export * from "./shared/channel-performance";
export * from "./shared/top-campaigns";
export * from "./shared/recent-conversations";
export * from "./shared/ranked-list";

/* Automations — one workspace and one builder, driven by channel. */
export * from "./automation/automation-node";
export * from "./automation/automations-workspace";
export * from "./automation/flow-builder";

/* WhatsApp */
export * from "./whatsapp/overview";
export * from "./whatsapp/inbox";
export * from "./whatsapp/campaigns-workspace";
export * from "./whatsapp/template-card";
export * from "./whatsapp/template-dialogs";
export * from "./whatsapp/templates-workspace";
export * from "./whatsapp/contact-dialogs";
export * from "./whatsapp/contacts-workspace";
export * from "./whatsapp/analytics";

/* Email */
export * from "./email/campaign-row";
export * from "./email/overview";
export * from "./email/campaigns-workspace";
export * from "./email/template-builder";
export * from "./email/templates-workspace";
export * from "./email/contacts-workspace";
export * from "./email/analytics";

/* SMS */
export * from "./sms/campaign-row";
export * from "./sms/composer";
export * from "./sms/overview";
export * from "./sms/campaigns-workspace";
export * from "./sms/templates-workspace";
export * from "./sms/contacts-workspace";
export * from "./sms/analytics";

/* Social Planner */
export * from "./social/post-status";
export * from "./social/post-composer";
export * from "./social/calendar";
export * from "./social/posts-workspace";
export * from "./social/media-library";
export * from "./social/accounts";
export * from "./social/analytics";

/* Audience segmentation, shared across the channels. */
export * from "./segments/segments-workspace";
