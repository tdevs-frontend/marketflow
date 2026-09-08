import {
  // AnalyticsSection,
  FinalCta,
  HeroSection,
  // MultiChannelCampaign,
  PlatformOverview,
  PricingSection,
  // TrustStats,
  WhatsAppAutomation,
} from "@/components/marketing";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <WhatsAppAutomation />

      {/* <MultiChannelCampaign /> */}

      {/* <AnalyticsSection /> */}

      {/* <TrustStats /> */}
      <PlatformOverview />

      <PricingSection />

      <FinalCta />
    </>
  );
}
