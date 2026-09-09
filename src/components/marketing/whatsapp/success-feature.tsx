import { Check } from "lucide-react";

export function SuccessFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="brand-gradient grid size-5 shrink-0 place-items-center rounded-full text-white"
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className="text-sm font-medium text-white">{children}</span>
    </li>
  );
}
