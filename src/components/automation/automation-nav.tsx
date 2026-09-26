"use client";

import { usePathname } from "next/navigation";

import { ModuleNav } from "@/components/layout/module-nav";
import { AUTOMATION_PAGES } from "@/constants/automation";

/**
 * Automation's tab strip: Workflows, Templates, Triggers, Activity.
 *
 * The shared `ModuleNav` - real links, so the active tab is the URL and Back
 * and Forward move between tabs. Shown on the four index pages only: a workflow
 * builder, a template or trigger detail and a run are one record each, carry
 * their own back link and header, and the builder in particular needs the
 * height the strip would take.
 */
const INDEX = new Set<string>(AUTOMATION_PAGES.map((page) => page.href));

export function AutomationNav() {
  const pathname = usePathname();
  if (!INDEX.has(pathname)) return null;

  return <ModuleNav items={[...AUTOMATION_PAGES]} label="Automation pages" />;
}
