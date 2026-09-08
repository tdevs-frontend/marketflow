import type { Metadata } from "next";

import { SocialPostsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Social Posts" };

export default function SocialPostsPage() {
  return (
    <>
      <PageHeader
        title="Posts"
        description="Every post as content or as performance — the grid reviews the caption, the table reviews the numbers."
        breadcrumb={channelCrumbs("social", "Posts")}
      />

      <SocialPostsWorkspace />
    </>
  );
}
