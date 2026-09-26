import type { Metadata } from "next";

import { FormEditor } from "@/components/forms";
import { FORMS } from "@/lib/form-fixtures";

export function generateStaticParams() {
  return FORMS.map((form) => ({ id: form.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/forms/[id]/edit">): Promise<Metadata> {
  const { id } = await params;
  const name = FORMS.find((form) => form.id === id)?.name;
  return { title: name ? `Edit ${name}` : "Edit form" };
}

/** The builder on an existing form - resolved on the client, see `FormEditor`. */
export default async function EditFormPage({
  params,
}: PageProps<"/dashboard/forms/[id]/edit">) {
  const { id } = await params;
  return <FormEditor id={id} />;
}
