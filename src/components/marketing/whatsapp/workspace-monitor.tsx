import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { AutomationFlowPanel } from "./automation-flow-panel";
import { ART_HOVER } from "./automation-data";
import { ConversationList, ConversationPanel } from "./conversation-panel";
import { WorkspaceSidebar } from "./workspace-sidebar";

/**
 * The workspace's own title bar: whose product this is, which room of it we
 * are standing in, and whether it is live.
 */
function WorkspaceTopBar() {
  return (
    <div
      aria-hidden
      className="flex h-6 shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2 @[440px]:h-8 @[440px]:gap-2 @[440px]:px-3"
    >
      <LogoMark size={12} className="shrink-0 rounded-[3px] @[440px]:hidden" />
      <LogoMark
        size={16}
        className="hidden shrink-0 rounded-sm @[440px]:block"
      />

      <span className="text-[8px] leading-none font-bold tracking-tight text-text-primary @[440px]:text-[10px]">
        MarketFlow
      </span>

      <span className="hidden h-2.5 w-px shrink-0 bg-border @[380px]:block" />
      <span className="hidden truncate text-[8px] leading-none text-text-muted @[380px]:block @[440px]:text-[9px]">
        WhatsApp Workspace
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-whatsapp-soft px-1.5 py-0.75 text-[7px] leading-none font-semibold text-whatsapp @[440px]:text-[8px]">
        <span className="animate-soft-pulse size-1 rounded-full bg-whatsapp-brand" />
        Live
      </span>
    </div>
  );
}

/**
 * Everything on the glass: title bar, then four columns of application.
 *
 * The columns are sized against the *screen*, not the viewport — the monitor
 * scales with its column, so a media query would be measuring the wrong box.
 * `@container` is declared on the screen in `WhatsAppWorkspaceMonitor` and
 * every panel drops or tightens off that: the inbox list goes first, then the
 * rail and the automation panel narrow, and the conversation keeps whatever is
 * left. Nothing ever disappears that the section is making a point about.
 */
function WorkspaceScreen() {
  return (
    <div className="flex h-full flex-col bg-background">
      <WorkspaceTopBar />

      <div className="flex min-h-0 flex-1">
        <WorkspaceSidebar />
        <ConversationList />
        <ConversationPanel />
        <AutomationFlowPanel />
      </div>
    </div>
  );
}

/**
 * A desktop monitor, drawn in CSS.
 *
 * Three parts and no more: a graphite frame with a bezel thin enough that the
 * screen is what you see, a short neck, and a wide flat base. The hardware is
 * meant to be read in half a second and then ignored — every detail beyond
 * that would be competing with the product it is holding.
 *
 * The frame is a vertical ramp rather than a flat fill (light along the top
 * edge, near-black at the bottom) with one white-to-transparent gloss over the
 * whole thing, which is what stops it reading as a black rectangle. The shadow
 * is deep and wide: the section's ground is a saturated indigo-violet, and a
 * shallow shadow on a coloured ground reads as a mistake rather than as depth.
 */
export function WhatsAppWorkspaceMonitor({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("@container relative", className)}>
      {/* Frame */}
      <div
        className={cn(
          "relative rounded-[16px] bg-linear-to-b from-[#3c4350] via-[#1b1e26] to-[#0e1015] p-1.5 @[440px]:rounded-[22px] @[440px]:p-2",
          "shadow-[0_36px_90px_rgba(15,23,42,0.45),0_12px_30px_rgba(15,23,42,0.28)]",
          ART_HOVER,
          "group-hover/art:shadow-[0_44px_104px_rgba(15,23,42,0.52),0_16px_36px_rgba(15,23,42,0.32)]",
        )}
      >
        {/* Camera. Barely there, which is the point of a thin bezel. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-[2.5px] left-1/2 size-0.75 -translate-x-1/2 rounded-full bg-white/20"
        />

        <div className="@container relative aspect-16/10 overflow-hidden rounded-[11px] bg-background @[440px]:rounded-[15px]">
          <WorkspaceScreen />
        </div>

        {/* Gloss across the housing. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[16px] bg-linear-to-b from-white/18 via-transparent to-white/6 @[440px]:rounded-[22px]"
        />
      </div>

      {/* Stand: neck, then base. */}
      <div aria-hidden className="relative flex flex-col items-center">
        <span className="h-4 w-14 bg-linear-to-b from-[#22262f] to-[#15181e] @[440px]:h-6 @[440px]:w-18" />
        <span className="h-1.25 w-32 rounded-[3px] bg-linear-to-b from-[#39404d] to-[#12141a] shadow-[0_10px_24px_rgba(15,23,42,0.4)] @[440px]:h-1.75 @[440px]:w-48" />
      </div>

      {/* Contact shadow under the base. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-1/2 h-6 w-[52%] -translate-x-1/2 rounded-[50%] bg-[#0b0d12]/45 blur-xl"
      />
    </div>
  );
}
