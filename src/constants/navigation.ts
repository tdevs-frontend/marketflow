export interface NavItem {
  title: string;
  href: string;
  /** Short label used by icon-only / collapsed sidebars. */
  icon: string;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
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

export const dashboardNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
      { title: "Analytics", href: "/dashboard/analytics", icon: "bar-chart" },
    ],
  },
  {
    title: "CRM",
    items: [
      { title: "Contacts", href: "/dashboard/contacts", icon: "users" },
      { title: "Leads", href: "/dashboard/leads", icon: "target" },
    ],
  },
  {
    title: "Engage",
    items: [
      { title: "Campaigns", href: "/dashboard/campaigns", icon: "megaphone" },
      { title: "WhatsApp", href: "/dashboard/whatsapp", icon: "message-circle" },
      { title: "Email", href: "/dashboard/email", icon: "mail" },
      { title: "SMS", href: "/dashboard/sms", icon: "smartphone" },
      { title: "Automation", href: "/dashboard/automation", icon: "workflow" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "Templates", href: "/dashboard/templates", icon: "file-text" },
      { title: "Integrations", href: "/dashboard/integrations", icon: "plug" },
      { title: "Settings", href: "/dashboard/settings", icon: "settings" },
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
