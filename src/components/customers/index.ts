/**
 * The Customers module's public surface.
 *
 * Pages import from here, never from a file inside — so a page never depends
 * on how the module is split up, and the split can change without touching
 * five routes.
 */
export * from "./customer-badges";
export * from "./activity-timeline";
export * from "./contacts-workspace";
export * from "./contact-drawer";
export * from "./contact-dialogs";
export * from "./leads-board";
export * from "./lead-drawer";
export * from "./tags-workspace";
export * from "./tag-dialogs";
export * from "./journey-workspace";
export * from "./journey-drawer";
