import type { Metadata } from "next";

import { FormDetail } from "@/components/forms";
import { FORM_TABS, type FormTab } from "@/constants/forms";
import { FORMS } from "@/lib/form-fixtures";

/** Prerenders a page per sample form; a session-made form renders on demand. */
export function generateStaticParams() {
  return FORMS.map((form) => ({ id: form.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/forms/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: FORMS.find((form) => form.id === id)?.name ?? "Form" };
}

/**
 * One form, with Overview, Submissions, Form, Automation and Settings.
 *
 * `?tab=` is read here on the server - the list's "View submissions" links to
 * it - and validated rather than trusted. The form itself is resolved on the
 * client, from the store, so a form created this session opens as well.
 */
export default async function FormDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/forms/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const initialTab = (FORM_TABS as readonly string[]).includes(String(tab))
    ? (tab as FormTab)
    : "overview";

  return <FormDetail id={id} initialTab={initialTab} />;
}
