import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortKey = "default" | "newest" | "az" | "km_asc" | "km_desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Predvolené" },
  { value: "newest", label: "Najnovšie pridané" },
  { value: "az", label: "A–Z" },
  { value: "km_asc", label: "Nájazd vzostupne" },
  { value: "km_desc", label: "Nájazd zostupne" },
];

export function VehicleSort({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="h-10 w-full sm:w-[200px] border-brand-border bg-brand-surface text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
