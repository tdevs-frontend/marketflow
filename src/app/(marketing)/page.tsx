import {
  // AnalyticsSection,
  BlogSection,
  FinalCta,
  HeroSection,
  // MultiChannelCampaign,
  PlatformOverview,
  PricingSection,
  TestimonialSection,
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

      <TestimonialSection />

      <PricingSection />

      <BlogSection />

      <FinalCta />
    </>
  );
}
