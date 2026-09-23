"use client";

import { useMemo } from "react";

import { CURRENT_MEMBER, roleById } from "@/lib/workspace-fixtures";
import type { PermissionAction } from "@/types/workspace";

/**
 * What the signed-in member may do, for the UI to reflect.
 *
 * Two things this is and is not.
 *
 * It *is* how the Workspace module obeys its own permission model: a Support
 * Agent opening Team Members sees the table and no Invite button, and a Viewer
 * opening Workspace Settings sees the values and disabled fields. A module that
 * hands out permissions while ignoring them is a module nobody believes.
 *
 * It is *not* enforcement. Everything here is client state and a determined
 * user can change it; the server has to make the same decision independently.
 * The reason to do it in the UI anyway is honesty - a button that is visible,
 * clickable and then fails is worse than one that says it is unavailable.
 *
 * `can` reads from the role the member actually holds, so changing your own
 * role in this session changes what the UI offers you, which is the behaviour
 * that makes the permission matrix legible.
 */
export interface WorkspacePermissions {
  can: (resource: string, action: PermissionAction) => boolean;
  /** Convenience for the three gates this module checks most. */
  canManageTeam: boolean;
  canManageRoles: boolean;
  canEditSettings: boolean;
  canExportActivity: boolean;
  roleName: string;
  memberId: string;
}

export function useWorkspacePermissions(
  /**
   * Overrides the member's stored role. Passed by pages that let a role be
   * edited in-session so the UI updates without a round trip.
   */
  roleIdOverride?: string,
): WorkspacePermissions {
  const roleId = roleIdOverride ?? CURRENT_MEMBER.roleId;

  return useMemo(() => {
    const role = roleById(roleId);
    const can = (resource: string, action: PermissionAction) =>
      role?.grants[resource]?.includes(action) ?? false;

    return {
      can,
      canManageTeam: can("team", "manage"),
      canManageRoles: can("roles", "manage"),
      canEditSettings: can("workspace_settings", "edit"),
      canExportActivity: can("workspace_activity", "export"),
      roleName: role?.name ?? "Unknown role",
      memberId: CURRENT_MEMBER.id,
    };
  }, [roleId]);
}

/**
 * The sentence a disabled control explains itself with.
 *
 * One phrasing everywhere, so a merchant who meets it twice recognises it as a
 * permission boundary rather than a bug. It names the permission, because
 * "ask an admin" without saying for what is a support ticket.
 */
export function permissionHint(permission: string, roleName: string): string {
  return `Your role (${roleName}) does not include ${permission}. Ask a Workspace Admin to grant it.`;
}
