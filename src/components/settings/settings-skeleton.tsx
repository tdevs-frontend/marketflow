import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/**
 * What a Settings page looks like before its data arrives.
 *
 * Shaped like the page rather than a generic spinner: a header, then two cards
 * with a field grid in each. The point of a skeleton is that the layout does
 * not jump when the content lands, so it has to be the same layout - which
 * means the same card as `SettingsSection` draws: one `p-5` box, a heading bar,
 * a description bar under it, and the content sixteen pixels below.
 *
 * The bars are drawn inline rather than handed to `CardHeader` as a `title` and
 * `description`. Those props render into an `<h3>` and a `<p>`, both of which
 * accept phrasing content only, and a `Skeleton` is a `<div>` - passing one in
 * produced markup no parser could represent and a hydration mismatch on every
 * Settings route. A placeholder is decoration; it does not want a heading
 * element in the first place.
 *
 * The section strip is not drawn here - it is in the layout, which renders
 * immediately and stays put while a page beneath it suspends.
 */
export function SettingsPageSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: sections }, (_, index) => (
          <Card key={index} className="flex flex-col p-5">
            {/* `h-5` and `h-3.5`: the heights of an 18px heading and a 14px
                line, so the card is the height the real one will be. */}
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-1.5 h-3.5 w-64 max-w-full" />

            <div className="mt-4 max-w-2xl space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <SkeletonField />
                <SkeletonField />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SkeletonField />
                <SkeletonField />
              </div>
              <SkeletonText lines={1} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function SkeletonField() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-24" />
      {/* `h-11` is the product's `md` input height - the row must not resize
          when the real field replaces this one. */}
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
