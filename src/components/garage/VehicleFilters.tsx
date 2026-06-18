import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const STATUS_OPTIONS = [
  { value: "all", label: "Všetky stavy" },
  { value: "OK", label: "OK" },
  { value: "SERVIS NUTNÝ", label: "SERVIS NUTNÝ" },
  { value: "NAPLÁNOVANÉ", label: "NAPLÁNOVANÉ" },
  { value: "ARCHÍV", label: "ARCHÍV" },
] as const;

export const FUEL_OPTIONS = [
  { value: "all", label: "Všetky palivá" },
  { value: "benzín", label: "benzín" },
  { value: "diesel", label: "diesel" },
  { value: "hybrid", label: "hybrid" },
  { value: "elektro", label: "elektro" },
  { value: "LPG", label: "LPG" },
] as const;

export function VehicleFilters({
  status,
  fuel,
  onStatusChange,
  onFuelChange,
}: {
  status: string;
  fuel: string;
  onStatusChange: (v: string) => void;
  onFuelChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-10 w-full sm:w-[180px] border-brand-border bg-brand-surface text-brand-fg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={fuel} onValueChange={onFuelChange}>
        <SelectTrigger className="h-10 w-full sm:w-[170px] border-brand-border bg-brand-surface text-brand-fg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FUEL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
