import { permanentRedirect } from "next/navigation";

import { APP_ROUTES } from "@/constants/app";

/**
 * The feed's old address.
 *
 * It lived here while it was a page of its own; it is the Activity tab of
 * Settings › Notifications now, beside the preferences that govern it. The
 * route stays so nothing that already points at it breaks - the header bell
 * did, and so may a bookmark.
 *
 * `permanentRedirect` rather than `redirect`: this is a 308, which says the
 * move is settled rather than temporary, so a browser stops asking and a
 * crawler updates its index. Nothing will be served here again.
 */
export default function LegacyNotificationsPage() {
  permanentRedirect(APP_ROUTES.settingsNotifications);
}
