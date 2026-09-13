import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Team" };

/**
 * Team replaces the four Workspace links — Team Members, Roles & Permissions,
 * Activity, Workspace Settings — none of which had a route behind them.
 *
 * When it is built it takes tabs for Members, Roles & Permissions, Activity
 * and Invitations, which is why it is one sidebar entry rather than four. The
 * roles the tabs will manage already exist in `constants/roles` and already
 * decide what this sidebar renders.
 */
export default function TeamPage() {
  return (
    <ModulePlaceholder
      title="Team"
      description="Invite people to this workspace and decide what each of them can reach."
      summary="Team will hold Members, Roles & Permissions, Activity and Invitations as tabs on this page. The roles themselves are already live — the sidebar you are looking at is filtered by the role you signed in with."
      action={
        <ButtonLink href={APP_ROUTES.settings} size="sm" variant="outline">
          Go to Settings
        </ButtonLink>
      }
    />
  );
}
