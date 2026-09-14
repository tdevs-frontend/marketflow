import { ModuleNav } from "@/components/layout/module-nav";
import { INTEGRATION_PAGES } from "@/constants/integrations";

/**
 * The Integrations workspace, and its own navigation.
 *
 * The sidebar already lists these six, but the strip stays: a merchant who
 * arrives on the WhatsApp page from a card on the hub needs to see the module
 * they are inside and be able to move sideways within it without going back to
 * the sidebar. One list, in `constants/integrations`, so the sidebar and the
 * strip cannot drift apart.
 */
export default function IntegrationsLayout({
  children,
}: LayoutProps<"/dashboard/integrations">) {
  return (
    <>
      <ModuleNav items={[...INTEGRATION_PAGES]} label="Integration pages" />
      {children}
    </>
  );
}
