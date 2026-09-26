import { redirect } from "next/navigation";

import { SUPPORT_ROUTES } from "@/constants/support";

/** The Admin area has one tool in this repo - the Support Desk. */
export default function AdminIndex() {
  redirect(SUPPORT_ROUTES.desk);
}
