import { AutomationNav } from "@/components/automation/automation-nav";

/**
 * The Automation module's frame: its own tab strip above every index page, as
 * Integrations and the Marketing channels have. The sidebar carries one
 * Automation row; this carries the module's pages.
 */
export default function AutomationLayout({
  children,
}: LayoutProps<"/dashboard/automation">) {
  return (
    <>
      <AutomationNav />
      {children}
    </>
  );
}
