import { History, SearchX } from "lucide-react";

type Variant = "empty" | "no-results";

export function EmptyServiceHistoryState({ variant }: { variant: Variant }) {
  const Icon = variant === "empty" ? History : SearchX;
  const title = variant === "empty" ? "Zatiaľ bez servisnej histórie" : "Žiadne výsledky";
  const text =
    variant === "empty"
      ? "Servisné záznamy sa zobrazia po pridaní prvého úkonu."
      : "Skúste upraviť vyhľadávanie alebo filtre.";

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand-border bg-brand-surface/40 px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-white/40" />
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="max-w-md text-sm text-white/60">{text}</p>
    </div>
  );
}
