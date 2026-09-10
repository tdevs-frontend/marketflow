import type { Metadata } from "next";

import { TagsWorkspace } from "@/components/customers";

export const metadata: Metadata = { title: "Tags" };

/**
 * Tag management. New route — the sidebar has linked here since the Customers
 * group was added, ahead of the page existing.
 */
export default function TagsPage() {
  return <TagsWorkspace />;
}
