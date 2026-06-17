import { Search } from "lucide-react";

export function VehicleSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-fg-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Vyhľadať meno, ŠPZ, VIN alebo model..."
        aria-label="Vyhľadať vozidlo"
        className="h-10 w-full rounded-md border border-brand-border bg-brand-surface pl-9 pr-3 text-sm text-brand-fg placeholder:text-brand-fg-subtle outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
      />
    </div>
  );
}
