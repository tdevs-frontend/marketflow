import { redirect } from "next/navigation";

import { APP_ROUTES } from "@/constants";

/**
 * Social Planner has no index of its own — the Calendar is the module's
 * landing page, which is where a content team actually starts. This exists so
 * the bare `/marketing/social` URL resolves rather than 404s.
 */
export default function SocialPlannerPage() {
  redirect(APP_ROUTES.socialCalendar);
}
