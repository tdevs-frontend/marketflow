export interface NavItem {
  title: string;
  href: string;
  /** Short label used by icon-only / collapsed sidebars. */
  icon: string;
  description?: string;
}

/** A leaf under a `DashboardNavItem`. Nesting stops here — one level only. */
export interface NavChild {
  title: string;
  href: string;
}

export interface DashboardNavItem {
  title: string;
  icon: string;
  /** Omitted only on items that exist purely to hold `items`. */
  href?: string;
  items?: NavChild[];
}

export interface NavSection {
  title: string;
  items: DashboardNavItem[];
}

export const marketingNav: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: "home",
  },
  {
    title: "Features",
    href: "/features",
    icon: "sparkles",
  },
  {
    title: "Solutions",
    href: "/solutions",
    icon: "briefcase",
  },
  {
    title: "Pricing",
    href: "/pricing",
    icon: "tag",
  },
  /* After Pricing rather than after Features: Blog is the one item here a
     visitor reaches when they are not ready to buy, so it sits past the ones
     that are part of the decision. The footer's Resources column has pointed
     at /blog since before the page existed. */
  {
    title: "Blog",
    href: "/blog",
    icon: "book-open",
  },
  {
    title: "Contact",
    href: "/contact",
    icon: "book-open",
  },
];

/**
 * The dashboard sidebar, top to bottom. Where a group's landing page exists it
 * keeps the bare route and the group nests under it — `/dashboard/settings` is
 * General. The sidebar derives which routes need an exact match.
 */
export const dashboardNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
    ],
  },
  {
    /* Ahead of Marketing: the catalogue is what everything downstream sells.
       Customers are not repeated — they have their own group. */
    /*
     * Six entries, matching the six questions a merchant asks:
     * what do I sell, what needs processing, how much did I sell, who bought
     * from me, what stock do I have, how do I promote.
     *
     * Categories and Product Catalog are gone from here — not removed, moved.
     * Both are views of the same product dataset and are reached from the strip
     * inside Products (see `commerce/product-views-nav`), which has existed for
     * a while; the sidebar was still listing them as well, so three rows pointed
     * at one database and a merchant had to guess which was "the real" one.
     */
    title: "Commerce",
    items: [
      { title: "Products", href: "/dashboard/products", icon: "package" },
      { title: "Orders", href: "/dashboard/orders", icon: "shopping-cart" },
      { title: "Sales", href: "/dashboard/sales", icon: "trending-up" },
      /* Paying customers, derived from orders — the CRM contact database is
         the Customers group below, and this links into it rather than copying
         it. The route nests under Sales because that is where the data is. */
      {
        title: "Customers",
        href: "/dashboard/sales/customers",
        icon: "user-check",
      },
      { title: "Inventory", href: "/dashboard/inventory", icon: "warehouse" },
      /* Moved out of Growth, where it was "Offers & Coupons" — same feature. */
      {
        title: "Discounts & Coupons",
        href: "/dashboard/discounts",
        icon: "badge-percent",
      },
    ],
  },
  {
    /*
     * The Marketing group, matching the product's own vocabulary: Overview and
     * Campaigns sit at the top as the cross-channel pages, then one collapsible
     * group per channel. Each channel group opens on its own Overview, except
     * Social Planner, whose landing page is the Calendar — that is where a
     * content team actually starts.
     */
    title: "Marketing",
    items: [
      { title: "Overview", href: "/dashboard/marketing", icon: "megaphone" },
      {
        title: "Campaigns",
        href: "/dashboard/marketing/campaigns",
        icon: "target",
      },
      {
        title: "WhatsApp",
        icon: "message-circle",
        items: [
          { title: "Overview", href: "/dashboard/marketing/whatsapp" },
          /* Second, not last. WhatsApp is the only channel with an Inbox, and
             appending it after a run of six entries every other channel shares
             left the sidebar out of step with the module's own strip, which
             has always read Overview then Inbox. One order, stated twice. */
          { title: "Inbox", href: "/dashboard/marketing/whatsapp/inbox" },
          {
            title: "Campaigns",
            href: "/dashboard/marketing/whatsapp/campaigns",
          },
          {
            title: "Templates",
            href: "/dashboard/marketing/whatsapp/templates",
          },
          { title: "Contacts", href: "/dashboard/marketing/whatsapp/contacts" },
          {
            title: "Automations",
            href: "/dashboard/marketing/whatsapp/automations",
          },
          {
            title: "Analytics",
            href: "/dashboard/marketing/whatsapp/analytics",
          },
        ],
      },
      {
        title: "Email",
        icon: "mail",
        items: [
          { title: "Overview", href: "/dashboard/marketing/email" },
          { title: "Campaigns", href: "/dashboard/marketing/email/campaigns" },
          { title: "Templates", href: "/dashboard/marketing/email/templates" },
          { title: "Contacts", href: "/dashboard/marketing/email/contacts" },
          {
            title: "Automations",
            href: "/dashboard/marketing/email/automations",
          },
          { title: "Analytics", href: "/dashboard/marketing/email/analytics" },
          { title: "Senders", href: "/dashboard/marketing/email/senders" },
        ],
      },
      {
        title: "SMS",
        icon: "smartphone",
        items: [
          { title: "Overview", href: "/dashboard/marketing/sms" },
          { title: "Campaigns", href: "/dashboard/marketing/sms/campaigns" },
          { title: "Templates", href: "/dashboard/marketing/sms/templates" },
          { title: "Contacts", href: "/dashboard/marketing/sms/contacts" },
          {
            title: "Automations",
            href: "/dashboard/marketing/sms/automations",
          },
          { title: "Analytics", href: "/dashboard/marketing/sms/analytics" },
        ],
      },
      {
        title: "Social Planner",
        icon: "calendar-days",
        items: [
          { title: "Calendar", href: "/dashboard/marketing/social/calendar" },
          { title: "Posts", href: "/dashboard/marketing/social/posts" },
          { title: "Accounts", href: "/dashboard/marketing/social/accounts" },
          { title: "Analytics", href: "/dashboard/marketing/social/analytics" },
        ],
      },
      /* Promoted out of the old Content group: every channel draws on it, so
         it belongs beside the channels rather than inside Social Planner. */
      {
        title: "Media Library",
        href: "/dashboard/marketing/social/media",
        icon: "image",
      },
      {
        title: "Audience Segments",
        href: "/dashboard/marketing/segments",
        icon: "layers",
      },
    ],
  },
  {
    title: "Customers",
    items: [
      { title: "Contacts", href: "/dashboard/contacts", icon: "users" },
      { title: "Leads", href: "/dashboard/leads", icon: "target" },
      { title: "Segments", href: "/dashboard/segments", icon: "layers" },
      { title: "Tags", href: "/dashboard/tags", icon: "tag" },
      {
        title: "Customer Journey",
        href: "/dashboard/customer-journey",
        icon: "git-branch",
      },
    ],
  },
  {
    title: "Automation",
    items: [
      { title: "Workflows", href: "/dashboard/automation", icon: "workflow" },
      {
        title: "Templates",
        href: "/dashboard/automation/templates",
        icon: "layout-template",
      },
      {
        title: "Triggers",
        href: "/dashboard/automation/triggers",
        icon: "zap",
      },
      {
        title: "Activity Logs",
        href: "/dashboard/automation/activity",
        icon: "scroll-text",
      },
    ],
  },
  /*
   * There is no Growth group.
   *
   * It held five rows and none of them earned a place in the sidebar. Reports
   * and Conversion Funnel had no route at all — both answered 404, which is a
   * navigation entry whose only behaviour is to break the page under it.
   * Forms and Landing Pages resolved, but only to a `ModulePlaceholder`
   * explaining that the module does not exist yet; a top-level row for a thing
   * that is not built is a promise the sidebar cannot keep.
   *
   * Analytics is real, and it is the one worth naming. It is not gone — the
   * route, the page and its charts are untouched — but it is now reached from
   * exactly one place: the "View analytics" link on the Marketing overview.
   * That is a contextual door next to the numbers it explains, which is a
   * better entrance than a sidebar row under a heading nobody could define,
   * but it is *one* door and worth knowing about before the next person
   * wonders where the charts went.
   *
   * Every route in this group still resolves. What was removed is navigation,
   * not functionality — see `constants/app.APP_ROUTES`, which still carries
   * them, and the permissions catalogue, which still governs them.
   */
  {
    /*
     * One row for the whole module.
     *
     * The seven integration pages are reached from the `ModuleNav` strip inside
     * the module — see `constants/integrations.INTEGRATION_PAGES`, which the
     * layout renders on every one of them. Listing the same seven here as well
     * was the sidebar doing the tab strip's job: fourteen entries for seven
     * destinations, and a group tall enough to push Workspace and Settings off
     * the first screen.
     *
     * This is the split the sidebar was designed around and that WhatsApp,
     * Email and the rest of Marketing already follow: the sidebar carries
     * business areas, the module carries its own pages.
     *
     * Note this row deliberately has no `items` — as the only href under
     * `/dashboard/integrations`, it drops out of the sidebar's `EXACT_HREFS`
     * set and so stays lit on every page in the module rather than only on the
     * hub. That is the behaviour a single module row should have.
     */
    title: "Integrations",
    items: [
      {
        title: "All Integrations",
        href: "/dashboard/integrations",
        icon: "plug",
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        title: "Team Members",
        href: "/dashboard/workspace/team",
        icon: "user-cog",
      },
      {
        title: "Roles & Permissions",
        href: "/dashboard/workspace/roles",
        icon: "shield-check",
      },
      {
        title: "Workspace Activity",
        href: "/dashboard/workspace/activity",
        icon: "activity",
      },
      {
        title: "Workspace Settings",
        href: "/dashboard/workspace/settings",
        icon: "building",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      /*
       * One row for the whole module — the same split Integrations follows.
       *
       * Settings carries its own navigation rail (see
       * `components/settings/settings-nav`, built from
       * `constants/settings.SETTINGS_NAV`), which lists Overview, Profile,
       * Notifications and Security. Repeating those four here would be the
       * sidebar doing the rail's job: eight entries for four destinations, in a
       * sidebar that is already the longest thing on the screen.
       *
       * This is the strategy the sidebar was designed around and that
       * Marketing, Commerce and Integrations all follow — the sidebar carries
       * business areas, the module carries its own pages.
       *
       * Billing and Developer used to be in that rail and are now groups of
       * their own above. Their routes still live under `/dashboard/settings/`,
       * so this row would prefix-match them; the sidebar resolves the *longest*
       * matching href instead, which lights Billing on the billing page and
       * leaves this row lit across the account pages where it belongs. See
       * `useActiveHref` in `layout/dashboard-sidebar`.
       */
      { title: "Settings", href: "/dashboard/settings", icon: "settings" },
      {
        title: "Billing & Subscription",
        href: "/dashboard/settings/billing",
        icon: "credit-card",
      },
      {
        title: "API & Developer",
        href: "/dashboard/settings/api",
        icon: "terminal",
      },
    ],
  },
];

export interface FooterLink {
  title: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  items: FooterLink[];
}

export interface SocialLink {
  label: string;
  href: string;
  /** Brand key rendered by `components/ui/brand-icon`. */
  icon: string;
}

/** Link columns rendered in the main footer, in display order. */
export const footerNav: FooterColumn[] = [
  {
    title: "Product",
    items: [
      { title: "Features", href: "/features" },
      { title: "WhatsApp Automation", href: "/features#whatsapp" },
      { title: "Campaigns", href: "/features#campaigns" },
      { title: "CRM & Leads", href: "/features#crm" },
      { title: "Automation Builder", href: "/features#automation" },
      { title: "Email Marketing", href: "/features#email" },
      { title: "SMS Marketing", href: "/features#sms" },
      { title: "Integrations", href: "/features#integrations" },
    ],
  },
  {
    title: "Solutions",
    items: [
      { title: "Small & Medium Business", href: "/solutions/small-business" },
      { title: "E-commerce", href: "/solutions/ecommerce" },
      { title: "Marketing Agencies", href: "/solutions/agencies" },
      { title: "Real Estate", href: "/solutions/real-estate" },
      { title: "Education", href: "/solutions/education" },
      { title: "Clinics & Salons", href: "/solutions/clinics-and-salons" },
      { title: "Restaurants", href: "/solutions/restaurants" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Documentation", href: "/docs" },
      { title: "Help Center", href: "/help" },
      { title: "Blog", href: "/blog" },
      { title: "Guides", href: "/guides" },
      { title: "Automation Templates", href: "/resources/templates" },
      { title: "API Documentation", href: "/docs/api" },
    ],
  },
  {
    title: "Legal",
    items: [
      { title: "Privacy Policy", href: "/legal/privacy" },
      { title: "Terms of Service", href: "/legal/terms" },
      { title: "Cookie Policy", href: "/legal/cookies" },
      { title: "Data Processing", href: "/legal/data-processing" },
      { title: "Acceptable Use Policy", href: "/legal/acceptable-use" },
      { title: "Security", href: "/security" },
    ],
  },
];

export const footerSocials: SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/marketflow", icon: "linkedin" },
  { label: "Facebook", href: "https://www.facebook.com/marketflow", icon: "facebook" },
  { label: "X", href: "https://x.com/marketflow", icon: "x" },
  { label: "YouTube", href: "https://www.youtube.com/@marketflow", icon: "youtube" },
];
