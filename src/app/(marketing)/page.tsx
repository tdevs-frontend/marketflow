import { HeroSection } from "@/components/marketing";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const HIGHLIGHTS = [
  {
    icon: "message-circle",
    title: "WhatsApp Business",
    body: "Run a shared team inbox, send approved templates, and keep every conversation on one timeline.",
  },
  {
    icon: "workflow",
    title: "Visual automation",
    body: "Trigger multi-step journeys on any signal — a tag, a form, a reply, or a stage change.",
  },
  {
    icon: "users",
    title: "Built-in CRM",
    body: "Contacts, leads, and pipelines stay in sync with every campaign you send.",
  },
  {
    icon: "bar-chart",
    title: "Unified analytics",
    body: "Compare email, SMS, and WhatsApp performance against revenue in a single report.",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section className="py-24">
        <div className="custom-container">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <Card key={item.title} className="p-6" interactive>
              <span className="grid h-10 w-10 place-items-center rounded-btn bg-primary-soft text-primary">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-text-secondary">{item.body}</p>
            </Card>
          ))}
        </div>
        </div>
      </section>
    </>
  );
}
