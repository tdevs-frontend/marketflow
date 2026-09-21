import { IntegrationModuleNav } from "@/components/integrations";

/**
 * The Integrations workspace, and its own navigation.
 *
 * The sidebar carries one row for the whole module, so the strip is how the six
 * provider pages are reached from each other — but it renders itself away on
 * the hub, where the filters already answer the same question. See
 * `IntegrationModuleNav`; the page list stays in `constants/integrations` so
 * the sidebar and the strip cannot drift apart.
 */
export default function IntegrationsLayout({
  children,
}: LayoutProps<"/dashboard/integrations">) {
  return (
    <>
      <IntegrationModuleNav />
      {children}
    </>
  );
}
