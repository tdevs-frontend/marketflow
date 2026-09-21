import { ModuleNav } from "@/components/layout/module-nav";
import { INTEGRATION_PAGES } from "@/constants/integrations";

/**
 * The Integrations workspace, and its own navigation.
 *
 * The strip renders on every page in the module, the hub included. The sidebar
 * carries one row for all seven, so this is the only thing that says which
 * module you are inside and the only way to move sideways within it — a
 * merchant who opens WhatsApp from a card needs to reach Email without going
 * back, and the hub needs to stay visible as the place they came from.
 *
 * It is navigation between pages, not a filter: the hub's search, status and
 * category controls narrow the catalogue, and these seven change which page you
 * are on. One list, in `constants/integrations`, so the sidebar and the strip
 * cannot drift apart.
 *
 * `ModuleNav` marks the current page by longest match, so `/integrations`
 * lights All Integrations while `/integrations/whatsapp` lights WhatsApp
 * rather than both.
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
