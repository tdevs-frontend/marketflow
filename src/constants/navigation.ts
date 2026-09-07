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
  /**
   * Omitted only on items that exist purely to hold `items`. Everything with
   * a page of its own keeps its own href, so nothing is reachable only by
   * expanding a parent.
   */
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
  {
    title: "Resources",
    href: "/resources",
    icon: "book-open",
  },
];

/**
 * The dashboard sidebar, top to bottom.
 *
 * Where a group's landing page already exists it keeps the bare route and the
 * rest of the group nests under it — `/dashboard/settings` is General, and
 * Profile, Billing and the others sit at `/dashboard/settings/*`. The sidebar
 * works out on its own which of those need an exact match, so adding a child
 * route never silently lights up its parent.
 */
export const dashboardNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" }],
  },
  {
    /*
     * Sits ahead of Marketing on purpose: the lifecycle runs product → order →
     * customer → marketing → revenue, and the catalogue is what everything
     * downstream is selling. Customers are not repeated here — they already
     * have their own group, and one contact record serves both sides.
     */
    title: "Commerce",
    items: [
      { title: "Products", href: "/dashboard/products", icon: "package" },
      { title: "Categories", href: "/dashboard/categories", icon: "folder-tree" },
      { title: "Orders", href: "/dashboard/orders", icon: "shopping-cart" },
      { title: "Inventory", href: "/dashboard/inventory", icon: "warehouse" },
      { title: "Product Catalog", href: "/dashboard/catalog", icon: "book-open" },
      /* Moved out of Growth, where it was "Offers & Coupons" — same feature. */
      { title: "Discounts & Coupons", href: "/dashboard/discounts", icon: "badge-percent" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { title: "Campaigns", href: "/dashboard/campaigns", icon: "megaphone" },
      {
        title: "WhatsApp",
        icon: "message-circle",
        items: [
          /* The existing WhatsApp page is the inbox, so it keeps the bare route. */
          { title: "Inbox", href: "/dashboard/whatsapp" },
          { title: "Campaigns", href: "/dashboard/whatsapp/campaigns" },
          { title: "Templates", href: "/dashboard/whatsapp/templates" },
          { title: "Contacts", href: "/dashboard/whatsapp/contacts" },
        ],
      },
      { title: "Email Marketing", href: "/dashboard/email", icon: "mail" },
      { title: "SMS Marketing", href: "/dashboard/sms", icon: "smartphone" },
      { title: "Social Planner", href: "/dashboard/social-planner", icon: "calendar-days" },
    ],
  },
  {
    title: "Customers",
    items: [
      { title: "Contacts", href: "/dashboard/contacts", icon: "users" },
      { title: "Leads", href: "/dashboard/leads", icon: "target" },
      { title: "Segments", href: "/dashboard/segments", icon: "layers" },
      { title: "Tags", href: "/dashboard/tags", icon: "tag" },
      { title: "Customer Journey", href: "/dashboard/customer-journey", icon: "git-branch" },
    ],
  },
  {
    title: "Automation",
    items: [
      { title: "Workflows", href: "/dashboard/automation", icon: "workflow" },
      { title: "Templates", href: "/dashboard/automation/templates", icon: "layout-template" },
      { title: "Triggers", href: "/dashboard/automation/triggers", icon: "zap" },
      { title: "Activity Logs", href: "/dashboard/automation/activity", icon: "scroll-text" },
    ],
  },
  {
    title: "Growth",
    items: [
      { title: "Analytics", href: "/dashboard/analytics", icon: "bar-chart" },
      { title: "Reports", href: "/dashboard/reports", icon: "clipboard-list" },
      { title: "Conversion Funnel", href: "/dashboard/conversion-funnel", icon: "funnel" },
      { title: "Forms", href: "/dashboard/forms", icon: "list-checks" },
      { title: "Landing Pages", href: "/dashboard/landing-pages", icon: "globe" },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Content Library", href: "/dashboard/content", icon: "library" },
      { title: "Message Templates", href: "/dashboard/templates", icon: "file-text" },
      { title: "Email Templates", href: "/dashboard/templates/email", icon: "mail-open" },
      { title: "Media Library", href: "/dashboard/media", icon: "image" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "All Integrations", href: "/dashboard/integrations", icon: "plug" },
      { title: "WhatsApp", href: "/dashboard/integrations/whatsapp", icon: "message-circle" },
      { title: "Email", href: "/dashboard/integrations/email", icon: "mail" },
      { title: "SMS", href: "/dashboard/integrations/sms", icon: "smartphone" },
      { title: "Webhooks", href: "/dashboard/integrations/webhooks", icon: "webhook" },
      { title: "API", href: "/dashboard/integrations/api", icon: "code" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "Team Members", href: "/dashboard/workspace/team", icon: "user-cog" },
      { title: "Roles & Permissions", href: "/dashboard/workspace/roles", icon: "shield-check" },
      { title: "Activity", href: "/dashboard/workspace/activity", icon: "activity" },
      { title: "Workspace Settings", href: "/dashboard/workspace/settings", icon: "building" },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "General", href: "/dashboard/settings", icon: "settings" },
      { title: "Profile", href: "/dashboard/settings/profile", icon: "user" },
      { title: "Notifications", href: "/dashboard/settings/notifications", icon: "bell" },
      { title: "Billing & Subscription", href: "/dashboard/settings/billing", icon: "credit-card" },
      { title: "Security", href: "/dashboard/settings/security", icon: "lock" },
      { title: "API & Developer", href: "/dashboard/settings/api", icon: "terminal" },
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
      { title: "Analytics & Reports", href: "/features#analytics" },
      { title: "Templates", href: "/features#templates" },
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
      { title: "Startups & Growing Brands", href: "/solutions/startups" },
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
      { title: "Changelog", href: "/changelog" },
      { title: "Community", href: "/community" },
    ],
  },
  {
    title: "Company",
    items: [
      { title: "About Us", href: "/about" },
      { title: "Contact", href: "/contact" },
      { title: "Pricing", href: "/pricing" },
      { title: "Partners", href: "/partners" },
      { title: "Careers", href: "/careers" },
      { title: "Become a Partner", href: "/partners/apply" },
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
  { label: "GitHub", href: "https://github.com/marketflow", icon: "github" },
];
