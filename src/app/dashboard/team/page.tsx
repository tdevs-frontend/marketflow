import { redirect } from "next/navigation";

import { WORKSPACE_ROUTES } from "@/constants/workspace";

/**
 * `/dashboard/team` is now Team Members under Workspace.
 *
 * This route held a placeholder saying Team would replace the four Workspace
 * links with tabs. It went the other way: the sidebar's Workspace group is the
 * navigation, and Members, Roles & Permissions, Activity and Settings are four
 * real pages. Rather than delete the path - it is in bookmarks and in the
 * placeholder's own copy - it forwards to the page that took the job.
 */
export default function TeamPage() {
  redirect(WORKSPACE_ROUTES.team);
}
