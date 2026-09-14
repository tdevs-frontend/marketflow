import type { Metadata } from "next";

import { MediaLibrary } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Media Library" };

export default function MediaLibraryPage() {
  return (
    <>
      <PageHeader
        title="Media Library"
        description="Upload images and video once, then reuse them across every post and platform."
      />

      <MediaLibrary />
    </>
  );
}
