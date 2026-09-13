import { ModuleNav } from "@/components/layout/module-nav";

/** The SMS workspace's own pages. One sidebar entry, six pages. */
const PAGES = [
  { title: "Overview", href: "/dashboard/marketing/sms" },
  { title: "Campaigns", href: "/dashboard/marketing/sms/campaigns" },
  { title: "Templates", href: "/dashboard/marketing/sms/templates" },
  { title: "Contacts", href: "/dashboard/marketing/sms/contacts" },
  { title: "Automations", href: "/dashboard/marketing/sms/automations" },
  { title: "Analytics", href: "/dashboard/marketing/sms/analytics" },
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
