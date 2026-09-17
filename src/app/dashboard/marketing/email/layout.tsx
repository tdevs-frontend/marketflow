import { ModuleNav } from "@/components/layout/module-nav";

/**
 * The Email workspace's own pages. One sidebar entry, seven pages.
 *
 * Senders sits last because it is configuration rather than work: it is opened
 * once when a domain is set up and then only when something stops delivering.
 */
const PAGES = [
  { title: "Overview", href: "/dashboard/marketing/email" },
  { title: "Campaigns", href: "/dashboard/marketing/email/campaigns" },
  { title: "Templates", href: "/dashboard/marketing/email/templates" },
  { title: "Contacts", href: "/dashboard/marketing/email/contacts" },
  { title: "Automations", href: "/dashboard/marketing/email/automations" },
  { title: "Analytics", href: "/dashboard/marketing/email/analytics" },
  { title: "Senders", href: "/dashboard/marketing/email/senders" },
];

export default function EmailLayout({
  children,
}: LayoutProps<"/dashboard/marketing/email">) {
  return (
    <>
      <ModuleNav items={PAGES} label="Email pages" />
      {children}
    </>
  );
}
