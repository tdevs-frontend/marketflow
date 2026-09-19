import { SettingsPageSkeleton } from "@/components/settings";

/**
 * Covers every route in the module.
 *
 * One boundary rather than six identical `loading.tsx` files: the pages differ
 * in content, not in shape — a header over a stack of sectioned cards — and the
 * section strip above lives in the layout, so it stays put while this swaps.
 */
export default function SettingsLoading() {
  return <SettingsPageSkeleton />;
}
