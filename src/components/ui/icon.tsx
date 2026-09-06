import {
  BarChart3,
  FileText,
  Home,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircle,
  Plug,
  Settings,
  Smartphone,
  Sparkles,
  Tag,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/** Maps the icon keys used in `constants/navigation` to Lucide components. */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  tag: Tag,
  "layout-dashboard": LayoutDashboard,
  "bar-chart": BarChart3,
  users: Users,
  target: Target,
  megaphone: Megaphone,
  "message-circle": MessageCircle,
  mail: Mail,
  smartphone: Smartphone,
  workflow: Workflow,
  "file-text": FileText,
  plug: Plug,
  settings: Settings,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = ICONS[name] ?? LayoutDashboard;
  return <Component className={className} aria-hidden />;
}
