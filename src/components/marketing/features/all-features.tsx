import { Sparkles } from "lucide-react";

import { Icon } from "@/components/ui/icon";

/**
 * The whole product, on one screen.
 *
 * Every other section on this page argues for one module in depth. This one
 * answers the question those sections cannot: how much is there? A prospect
 * evaluating a platform is counting as much as reading, and eleven deep
 * sections make them scroll for ten minutes to find out that commerce is
 * included. Forty-three named modules in one card answers it in five seconds.
 *
 * Names only, no descriptions. The sections above already explain what each
 * area does, and forty-three two-line items would be a second, worse version of
 * the same page — the job here is the map, not the territory. It is also what
 * keeps the section scannable: a reader's eye runs down a column of nouns and
 * stops at the one they came for.
 *
 * Every entry is a module that ships. The list was built from
 * `constants/navigation.dashboardNav` rather than from the marketing brief, and
 * two entries the brief asked for are deliberately absent — see `ANALYTICS`.
 *
 * Laid out in CSS columns rather than a grid. Groups are four to eight items
 * long, so a grid leaves a ragged floor under the short ones; columns pack them
 * and `break-inside-avoid` keeps a group whole. Four columns, two, then one,
 * which is the responsive shape the brief asks for and what the column count
 * gives for free.
 */

interface Group {
  label: string;
  items: { name: string; icon: string }[];
}

/**
 * Icons are the ones the sidebar already assigns each module, so a visitor who
 * signs up meets the same glyph next to the same word. Where a module has no
 * sidebar row of its own — the analytics panels — the icon is the one its own
 * page draws it with.
 */
const GROUPS: Group[] = [
  {
    label: "Customers",
    items: [
      { name: "Contacts", icon: "users" },
      { name: "Leads", icon: "target" },
      { name: "Audience Segments", icon: "layers" },
      { name: "Tags", icon: "tag" },
      { name: "Customer Journey", icon: "git-branch" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Campaigns", icon: "megaphone" },
      { name: "WhatsApp", icon: "message-circle" },
      { name: "Email", icon: "mail" },
      { name: "SMS", icon: "smartphone" },
      { name: "Social Planner", icon: "calendar-days" },
      { name: "Media Library", icon: "image" },
    ],
  },
  {
    label: "Automation",
    items: [
      { name: "Workflows", icon: "workflow" },
      { name: "Templates", icon: "layout-template" },
      { name: "Triggers", icon: "zap" },
      { name: "Activity Logs", icon: "scroll-text" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { name: "Products", icon: "package" },
      { name: "Orders", icon: "shopping-cart" },
      { name: "Categories", icon: "folder-tree" },
      { name: "Catalog", icon: "book-open" },
      { name: "Inventory", icon: "warehouse" },
      { name: "Discounts & Coupons", icon: "badge-percent" },
    ],
  },
  {
    /*
     * Five panels, not the six the brief listed.
     *
     * "Reports" is not here because there is no reports module — the sidebar
     * carried a row for it once and it answered 404, which is why the row was
     * removed (see the note in `constants/navigation`). Listing it on a
     * marketing page would re-make a promise the product already withdrew.
     * What does exist is named instead, panel by panel.
     */
    label: "Analytics",
    items: [
      { name: "Growth Overview", icon: "trending-up" },
      { name: "Campaign Performance", icon: "bar-chart" },
      { name: "Channel Performance", icon: "layers" },
      { name: "Conversion Funnel", icon: "funnel" },
      { name: "Social Analytics", icon: "share-2" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { name: "WhatsApp Business", icon: "message-circle" },
      { name: "Email", icon: "mail" },
      { name: "SMS", icon: "smartphone" },
      { name: "Social Media", icon: "share-2" },
      { name: "Shopify", icon: "shopping-cart" },
      { name: "Google Analytics 4", icon: "bar-chart" },
      { name: "Webhooks", icon: "webhook" },
      { name: "API", icon: "code" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { name: "Team Members", icon: "user-cog" },
      { name: "Roles & Permissions", icon: "shield-check" },
      { name: "Workspace Activity", icon: "activity" },
      { name: "Workspace Settings", icon: "building" },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Profile", icon: "user" },
      { name: "Notifications", icon: "bell" },
      { name: "Security", icon: "lock" },
      { name: "Billing & Subscription", icon: "credit-card" },
      { name: "API & Developer", icon: "terminal" },
    ],
  },
];

export function AllFeatures() {
  return (
    <section
      id="all-features"
      aria-labelledby="all-features-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        {/*
         * One card holding the whole map.
         *
         * The card is what makes this read as a product overview rather than as
         * another page section: it is a single object a visitor can take in at
         * once, and its white ground lifts forty-three quiet rows off the
         * tinted canvas without any of them needing a border of their own.
         */}
        <div className="overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 shadow-card sm:rounded-[28px] sm:px-10 sm:py-16 lg:px-14">
          <header className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-soft py-1.5 pr-4 pl-3 text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              Our features
            </p>

            <h2
              id="all-features-title"
              className="section-title mt-5 text-balance"
            >
              One connected platform for customers, conversations and{" "}
              <span className="brand-gradient-text">growth</span>.
            </h2>

            <p className="mt-5 text-base leading-[1.7] text-text-secondary text-pretty">
              Manage your customers, launch campaigns, automate conversations,
              grow your sales and measure performance — all from one connected
              workspace.
            </p>
          </header>

          {/* The map. `gap-x-10` is the column gutter; the vertical rhythm is
              each group's own bottom margin, since columns have no row gap. */}
          <div className="mt-12 columns-1 gap-x-10 sm:columns-2 xl:columns-4">
            {GROUPS.map((group) => (
              <section
                key={group.label}
                aria-labelledby={`all-features-${group.label.toLowerCase()}`}
                className="mb-9 break-inside-avoid last:mb-0"
              >
                <h3
                  id={`all-features-${group.label.toLowerCase()}`}
                  className="border-b border-border pb-2.5 text-xs font-semibold tracking-[0.1em] text-text-muted uppercase"
                >
                  {group.label}
                </h3>

                <ul className="mt-3 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={`${group.label}-${item.name}`}>
                      {/*
                       * A row, not a card. Forty-three bordered tiles is the
                       * "wall of cards" this section exists to avoid; the
                       * ground only appears under the pointer, which keeps the
                       * resting state quiet and still makes the row feel like
                       * an object.
                       */}
                      <span className="flex items-center gap-2.5 rounded-btn px-2 py-1.5 transition-colors hover:bg-surface-secondary">
                        <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-primary-soft text-primary">
                          <Icon name={item.icon} className="size-3.5" />
                        </span>
                        <span className="min-w-0 text-sm font-medium text-text-primary">
                          {item.name}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-12 border-t border-border pt-8 text-center text-sm text-text-muted">
            Everything your team needs — connected in one workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
