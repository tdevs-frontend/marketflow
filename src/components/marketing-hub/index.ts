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

/* WhatsApp */
export * from "./whatsapp/inbox";
export * from "./whatsapp/campaigns-workspace";
export * from "./whatsapp/template-card";
export * from "./whatsapp/template-dialogs";
export * from "./whatsapp/templates-workspace";
export * from "./whatsapp/contact-dialogs";
export * from "./whatsapp/contacts-workspace";
