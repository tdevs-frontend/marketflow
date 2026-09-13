import { WorkflowDetailSkeleton } from "@/components/automation/automation-skeletons";

/**
 * The workflow detail, loading.
 *
 * Its own file rather than the group's: a card grid resolving into a
 * three-panel builder is the most visible layout jump in the module, and the
 * builder's shape is exactly what a reader is waiting to see.
 */
export default function WorkflowDetailLoading() {
  return <WorkflowDetailSkeleton />;
}
