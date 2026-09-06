import {
  AnalyticsSection,
  HeroSection,
  MultiChannelCampaign,
  PlatformOverview,
  TrustStats,
  WhatsAppAutomation,
} from "@/components/marketing";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <PlatformOverview />

      <WhatsAppAutomation />

      <MultiChannelCampaign />

      <AnalyticsSection />

      <TrustStats />
    </>
  );
}
