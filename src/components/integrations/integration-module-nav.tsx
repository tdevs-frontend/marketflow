"use client";

import { usePathname } from "next/navigation";

import { ModuleNav } from "@/components/layout/module-nav";
import { INTEGRATION_PAGES, INTEGRATION_ROUTES } from "@/constants/integrations";

/**
 * The module strip, everywhere in Integrations except the hub.
 *
 * The six provider pages are reachable only from here and from the hub's cards
 * — the sidebar carries one row for the whole module — so a merchant who opens
 * WhatsApp from a card needs the strip to move sideways to Email without going
 * back. That is navigation, and it stays.
 *
 * On the hub it is not navigation. Sitting above a search box, a category
 * select and five status chips, a row reading WhatsApp · Email · SMS · Social
 * reads as a sixth filter that disagrees with the other three — two controls
 * for the same question, one of which silently replaces the page. The hub
 * filters the catalogue; the strip moves between pages; and the hub is the one
 * place those two jobs collide.
 */
export function IntegrationModuleNav() {
  const pathname = usePathname();

  if (pathname === INTEGRATION_ROUTES.hub) return null;

  return <ModuleNav items={[...INTEGRATION_PAGES]} label="Integration pages" />;
}
