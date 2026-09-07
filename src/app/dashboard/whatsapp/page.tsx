import { redirect } from "next/navigation";

/** Moved under /dashboard/marketing. Kept so existing links do not 404. */
export default function Page() {
  redirect("/dashboard/marketing/whatsapp/inbox");
}
