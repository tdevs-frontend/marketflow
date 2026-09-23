import { ModuleNav } from "@/components/layout/module-nav";

/**
 * The WhatsApp workspace, and its own navigation.
 *
 * The sidebar shows one entry for this module; everything below lives here.
 * A layout rather than a strip repeated in seven pages - one list, and a new
 * page joins it by being added once.
 */
const PAGES = [
  { title: "Overview", href: "/dashboard/marketing/whatsapp" },
  { title: "Inbox", href: "/dashboard/marketing/whatsapp/inbox" },
  { title: "Campaigns", href: "/dashboard/marketing/whatsapp/campaigns" },
  { title: "Templates", href: "/dashboard/marketing/whatsapp/templates" },
  { title: "Contacts", href: "/dashboard/marketing/whatsapp/contacts" },
  { title: "Automations", href: "/dashboard/marketing/whatsapp/automations" },
  { title: "Analytics", href: "/dashboard/marketing/whatsapp/analytics" },
];

export default function WhatsAppLayout({
  children,
}: LayoutProps<"/dashboard/marketing/whatsapp">) {
  return (
    <>
      <ModuleNav items={PAGES} label="WhatsApp pages" />
      {children}
    </>
  );
}
