import { ModuleNav } from "@/components/layout/module-nav";

/**
 * The SMS workspace's own pages. One sidebar entry, seven pages.
 *
 * Senders sits last for the same reason it does under Email: it is
 * configuration rather than work, opened once when a sender is registered and
 * then only when a carrier stops accepting it.
 */
const PAGES = [
  { title: "Overview", href: "/dashboard/marketing/sms" },
  { title: "Campaigns", href: "/dashboard/marketing/sms/campaigns" },
  { title: "Templates", href: "/dashboard/marketing/sms/templates" },
  { title: "Contacts", href: "/dashboard/marketing/sms/contacts" },
  { title: "Automations", href: "/dashboard/marketing/sms/automations" },
  { title: "Analytics", href: "/dashboard/marketing/sms/analytics" },
  { title: "Senders", href: "/dashboard/marketing/sms/senders" },
];

export default function SmsLayout({
  children,
}: LayoutProps<"/dashboard/marketing/sms">) {
  return (
    <>
      <ModuleNav items={PAGES} label="SMS pages" />
      {children}
    </>
  );
}
