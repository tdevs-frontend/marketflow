import type { Metadata } from "next";
import {
  BarChart3,
  MessageCircle,
  Megaphone,
  Package,
  Plug,
  Send,
  Share2,
  UsersRound,
  Workflow,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { AutomationVisual } from "@/components/marketing/whatsapp";
import {
  AllFeatures,
  AnalyticsVisual,
  CampaignVisual,
  ChannelVisual,
  CommerceVisual,
  ConnectedJourney,
  CrmVisual,
  FeatureNav,
  FeatureSection,
  FeaturesCta,
  FeaturesFaq,
  FeaturesHero,
  IntegrationsVisual,
  PlatformFlow,
  SocialVisual,
  SupportingStrip,
  WorkflowVisual,
  WorkspaceVisual,
} from "@/components/marketing/features";

export const metadata: Metadata = {
  /*
   * `absolute`, so the root layout stops appending "· MarketFlow".
   *
   * The template is right for every other page and wrong for this one: the
   * title already opens with the brand, and the suffix pushed it past the ~60
   * characters a search result shows, truncating the half that describes the
   * product.
   */
  title: {
    absolute:
      "MarketFlow Features — CRM, Marketing Automation & Customer Conversations",
  },
  description:
    "Explore MarketFlow features for CRM, WhatsApp automation, marketing campaigns, commerce, customer journeys, analytics and integrations.",
};

/**
 * The Features page.
 *
 * The home page sells the idea and this page proves it, so every claim below is
 * paired with a mock-up of the screen that backs it and every section is named
 * after a module that ships. Nothing here is a capability MarketFlow does not
 * have, and nothing is a generic SaaS illustration — each visual carries the
 * dashboard route it is drawn from, in the frame's chrome bar.
 *
 * Order is the customer journey, not the sidebar: WhatsApp and CRM first
 * because that is where a prospect's attention already is, then the work
 * (campaigns, automation), then what it produces (commerce, social, email and
 * SMS, analytics), then the plumbing, and finally the walk-through that ties
 * the lot together.
 *
 * Sections alternate side and ground — `reverse` and `ground` on
 * `FeatureSection` — which is what keeps eleven two-column blocks from reading
 * as one long table. The rhythm is set here rather than inside the sections so
 * it can be read in one place and cannot drift.
 *
 * The ground half of that rhythm is load-bearing for spacing, not just for
 * looks. Every section spends `section-space-py` on its own padding, so two
 * neighbours on the same ground put 160px of unbroken canvas between their
 * content with nothing to say a section ended — which reads as a gap rather
 * than as a boundary. The live set runs white, tint, white, tint:
 * `AllFeatures`, `PlatformFlow`, the CRM section, `FeaturesFaq`. Re-enabling a
 * commented-out section means re-walking `ground` down the page from the top,
 * since the values below were tuned against the sections that actually render.
 *
 * Anchor ids are load-bearing: the site footer has linked to `#whatsapp`,
 * `#crm`, `#campaigns`, `#automation`, `#email`, `#sms` and `#integrations`
 * since before this page existed. Email and SMS share a section, so `#sms` is
 * carried as a secondary anchor rather than being split off into a section of
 * its own to satisfy a URL.
 */
export default function FeaturesPage() {
  return (
    <>
      {/* <FeaturesHero />
      <FeatureNav /> */}

      {/*
       * The map before the tour.
       *
       * A visitor who has just read the hero is still asking how much is in
       * here, and eleven deep sections answer that slowly. `AllFeatures` lists
       * every module at once, so the sections below are read as detail on
       * something already understood rather than as an unbounded scroll.
       */}
      <AllFeatures />

      <PlatformFlow />
{/* 
      <FeatureSection
        id="whatsapp"
        eyebrow="WhatsApp & Conversations"
        eyebrowIcon={MessageCircle}
        title="Turn WhatsApp conversations into automated customer journeys"
        description="Capture leads, manage conversations, send personalized messages, automate follow-ups, and keep your team aligned from one shared workspace."
        capabilityLabel="In the workspace"
        capabilities={[
          "Shared WhatsApp inbox",
          "Automated replies",
          "Personalized messages",
          "Conversation tracking",
          "Approved templates",
          "WhatsApp campaigns",
        ]}
        footer={
          <ButtonLink href={APP_ROUTES.register} variant="secondary">
            Start with WhatsApp
          </ButtonLink>
        }
        layout="stacked"
        visual={
          <div className="flex justify-center">
            <AutomationVisual />
          </div>
        }
      /> */}

      <FeatureSection
        id="crm"
        eyebrow="CRM & Customer Management"
        eyebrowIcon={UsersRound}
        title="Keep every customer relationship in one place"
        description="Organize contacts, leads, segments, tags and customer journeys, and give your team the context they need to convert more conversations."
        capabilityLabel="What you get"
        capabilities={[
          "Contacts with custom fields",
          "Drag-and-drop lead pipeline",
          "Segments",
          "Tags",
          "Customer journey",
          "Full conversation history",
        ]}
        visual={<CrmVisual />}
        reverse
      />

      {/* <FeatureSection
        id="campaigns"
        eyebrow="Marketing"
        eyebrowIcon={Megaphone}
        title="Launch campaigns across the channels your customers already use"
        description="Create, manage and measure targeted campaigns across WhatsApp, Email, SMS and Social — from one audience, with one set of numbers at the end."
        capabilityLabel="Channels"
        capabilities={[
          "WhatsApp campaigns",
          "Email campaigns",
          "SMS campaigns",
          "Social posts",
          "Audience segments",
          "Per-campaign reporting",
        ]}
        visual={<CampaignVisual />}
      />

      <FeatureSection
        id="automation"
        eyebrow="Automation"
        eyebrowIcon={Workflow}
        title="Build journeys that keep working after your team logs off"
        description="Create branching workflows triggered by customer activity, lead events, orders, messages and other signals — then watch every run in the activity log."
        capabilityLabel="Steps and triggers"
        capabilities={[
          "Conditions and branches",
          "Wait steps",
          "Channel messages",
          "CRM actions",
          "Outbound webhooks",
          "Workflow templates",
        ]}
        visual={<WorkflowVisual />}
        reverse
        ground="tint"
      /> */}

      {/* <FeatureSection
        id="commerce"
        eyebrow="Commerce"
        eyebrowIcon={Package}
        title="Connect marketing with the orders that matter"
        description="Manage products, orders, inventory, categories, catalogs and discounts alongside customer and marketing activity — so revenue is attached to the conversation that produced it."
        capabilities={[
          "Products",
          "Orders",
          "Inventory",
          "Categories",
          "Catalog",
          "Discounts & coupons",
        ]}
        visual={<CommerceVisual />}
      />

      <FeatureSection
        id="social"
        eyebrow="Social & Multi-channel"
        eyebrowIcon={Share2}
        title="Plan, publish and measure your social presence"
        description="Manage social content from planning through publishing and performance analysis, with every connected account in one calendar."
        capabilities={[
          "Social Planner",
          "Posts",
          "Calendar",
          "Media library",
          "Social analytics",
          "Connected accounts",
        ]}
        visual={<SocialVisual />}
        reverse
        ground="tint"
      />

      <FeatureSection
        id="email"
        anchors={["sms"]}
        eyebrow="Email & SMS"
        eyebrowIcon={Send}
        title="Reach customers beyond WhatsApp"
        description="Email and SMS share the same audiences, templates and reporting as every other channel — so switching between them is a choice about reach, not a second tool to learn."
        capabilityLabel="Both channels"
        capabilities={[
          "Campaigns",
          "Templates",
          "Senders",
          "Contacts",
          "Delivery reporting",
          "Analytics",
        ]}
        visual={<ChannelVisual />}
      />

      <FeatureSection
        id="analytics"
        eyebrow="Analytics"
        eyebrowIcon={BarChart3}
        title="See what turns conversations into revenue"
        description="Measure leads, conversations, campaigns, conversions, orders and revenue across your marketing channels — attributed back to the campaign that started it."
        capabilityLabel="Reports"
        capabilities={[
          "Growth overview",
          "Campaign performance",
          "Channel performance",
          "Conversion funnel",
          "Revenue attribution",
          "Reach and engagement",
        ]}
        visual={<AnalyticsVisual />}
        reverse
        ground="tint"
      />

      <FeatureSection
        id="integrations"
        eyebrow="Integrations"
        eyebrowIcon={Plug}
        title="Connect the tools already running your business"
        description="Connect messaging, commerce, analytics and developer services without breaking your existing workflow — and see at a glance when one of them stops working."
        capabilityLabel="Available today"
        capabilities={[
          "WhatsApp Business",
          "Email providers",
          "SMS gateways",
          "Social accounts",
          "Shopify",
          "Google Analytics 4",
          "Webhooks",
          "REST API",
        ]}
        visual={<IntegrationsVisual />}
      /> */}

      {/* <FeatureSection
        id="workspace"
        eyebrow="Team & Workspace"
        eyebrowIcon={UsersRound}
        title="Give your team the context and control they need"
        description="Manage team members, roles, permissions, workspace activity and settings from one place."
        visual={<WorkspaceVisual />}
        reverse
        ground="tint"
      /> */}

      {/* <SupportingStrip /> */}

      {/* <ConnectedJourney /> */}

      <FeaturesFaq />

      {/* <FeaturesCta /> */}
    </>
  );
}
