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
      className="flex h-6 shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2 @[440px]:h-8 @[440px]:gap-2 @[440px]:px-3 @[600px]:h-9.5"
    >
      <LogoMark size={12} className="shrink-0 rounded-[3px] @[440px]:hidden" />
      <LogoMark
        size={16}
        className="hidden shrink-0 rounded-sm @[440px]:block @[600px]:hidden"
      />
      <LogoMark
        size={20}
        className="hidden shrink-0 rounded-sm @[600px]:block"
      />

      <span className="text-[8px] leading-none font-bold tracking-tight text-text-primary @[440px]:text-[10px] @[600px]:text-[11.5px]">
        MarketFlow
      </span>

      <span className="hidden h-2.5 w-px shrink-0 bg-border @[380px]:block" />
      <span className="hidden truncate text-[8px] leading-none text-text-muted @[380px]:block @[440px]:text-[9px] @[600px]:text-[10.5px]">
        WhatsApp Workspace
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-whatsapp-soft px-1.5 py-0.75 text-[7px] leading-none font-semibold text-whatsapp @[440px]:text-[8px] @[600px]:px-2 @[600px]:py-1 @[600px]:text-[9px]">
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
 * screen is what you see, an aluminium neck, and a wide flat base. The
 * hardware is meant to be read in half a second and then ignored — every
 * detail beyond that would be competing with the product it is holding.
 *
 * What makes it read as hardware rather than as a rounded card is the ratio of
 * the three: a 6–8px bezel on a 16:10 panel, then a neck about an eighth of
 * the screen's width, then a base a third of it. Get those wrong in either
 * direction and it becomes a television or a browser chrome.
 *
 * The frame is a vertical ramp rather than a flat fill (light along the top
 * edge, near-black under the chin) with one white-to-transparent gloss over
 * the whole thing, which is what stops it reading as a black rectangle. The
 * shadow is deep and wide: the section's ground is a saturated indigo-violet,
 * and a shallow shadow on a coloured ground reads as a mistake rather than as
 * depth.
 *
 * Every dimension is a container query on this element rather than a media
 * query, so the whole assembly stays in proportion at any column width — the
 * monitor is never measuring the viewport it happens to be sitting in.
 */
export function WhatsAppWorkspaceMonitor({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("@container relative", className)}>
      {/* Frame. A slightly deeper chin than bezel, as the real thing has. */}
      <div
        className={cn(
          "relative rounded-[12px] bg-linear-to-b from-[#3a3d44] via-[#292b30] to-[#1a1c20] p-1.5 pb-2 @[440px]:rounded-[14px] @[440px]:p-2 @[440px]:pb-2.5",
          "shadow-[0_30px_70px_rgba(20,20,35,0.34),0_12px_30px_rgba(15,23,42,0.26)]",
          ART_HOVER,
          "group-hover/art:shadow-[0_38px_84px_rgba(20,20,35,0.4),0_16px_36px_rgba(15,23,42,0.3)]",
        )}
      >
        {/* Camera. Barely there, which is the point of a thin bezel. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-[2.5px] left-1/2 size-0.75 -translate-x-1/2 rounded-full bg-white/22 @[440px]:top-[3.5px]"
        />

        {/* The glass, recessed into the frame by one dark inner edge. */}
        <div className="@container relative aspect-16/10 overflow-hidden rounded-[7px] bg-background shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] @[440px]:rounded-[8px]">
          <WorkspaceScreen />
        </div>

        {/* Gloss across the housing. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[12px] bg-linear-to-b from-white/16 via-transparent to-white/5 @[440px]:rounded-[14px]"
        />
      </div>

      {/*
       * Stand: neck, then base.
       *
       * Matte aluminium, not chrome — the highlight runs down the middle and
       * stops well short of white, so it reads as brushed metal catching one
       * light source rather than as a mirror.
       *
       * The neck flares, but barely: 2% a side. The obvious move is to flare it
       * hard, and it is wrong — on a stem this short a strong taper reads as a
       * funnel or a lampshade rather than as a machined column, and the whole
       * thing stops looking like a monitor. Real stands are all but vertical.
       *
       * The base is two pieces because one cannot be both: a top surface you
       * are looking slightly down onto, lightest at the front lip where it
       * catches the room, and under it a darker front edge with the thickness.
       * A single slab with a gradient only ever reads as a light-grey pill.
       */}
      <div aria-hidden className="relative flex flex-col items-center">
        <span className="h-10 w-13 bg-[linear-gradient(90deg,#6f757e_0%,#868d97_10%,#a8afb9_26%,#cfd4db_46%,#b3b8c1_62%,#8d939d_84%,#70767f_100%)] [clip-path:polygon(2%_0,98%_0,100%_100%,0_100%)] @[440px]:h-15 @[440px]:w-17 @[600px]:h-19 @[600px]:w-20" />

        <span className="h-1.5 w-38 bg-[linear-gradient(180deg,#b9bec6_0%,#d5d9df_55%,#e9ebee_100%)] [clip-path:polygon(3%_0,97%_0,100%_100%,0_100%)] @[440px]:h-2 @[440px]:w-48 @[600px]:w-52" />
        <span className="h-0.5 w-40 rounded-b-[3px] bg-[linear-gradient(180deg,#949aa2_0%,#6c717a_100%)] shadow-[0_10px_24px_rgba(15,23,42,0.34)] @[440px]:w-50 @[600px]:h-1 @[600px]:w-54" />
      </div>

      {/* Contact shadow under the base. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-1/2 h-6 w-[52%] -translate-x-1/2 rounded-[50%] bg-[#0b0d12]/45 blur-xl"
      />
    </div>
  );
}
