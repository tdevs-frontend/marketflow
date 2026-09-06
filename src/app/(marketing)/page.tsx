import {
  AnalyticsSection,
  HeroSection,
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

      <AnalyticsSection />

      <TrustStats />
    </>
  );
}
