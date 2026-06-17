import { cn } from "@/lib/utils";

function styleFor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("komplet")) return "bg-blue-600/20 text-blue-300 border-blue-500/30";
  if (t.includes("olej")) return "bg-amber-600/20 text-amber-300 border-amber-500/30";
  if (t.includes("brzd")) return "bg-red-600/20 text-red-300 border-red-500/30";
  if (t.includes("kontrol") || t.includes("diagnost"))
    return "bg-zinc-600/30 text-zinc-200 border-zinc-500/30";
  return "bg-white/5 text-white/80 border-brand-border";
}

export function ServiceTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styleFor(type),
        className,
      )}
    >
      {type}
    </span>
  );
}
