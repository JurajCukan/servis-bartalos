import { Car } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-brand-border bg-brand-surface/50 px-6 py-16 text-center">
      <div className="rounded-full bg-brand-bg p-4 text-brand-fg-subtle">
        {icon ?? <Car className="h-8 w-8" aria-hidden />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-brand-fg">{title}</h3>
        <p className="text-sm text-brand-fg-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
