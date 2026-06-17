import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_TYPE_OPTIONS } from "@/lib/queries/serviceHistory";

type Props = {
  q: string;
  type: string;
  onQChange: (v: string) => void;
  onTypeChange: (v: string) => void;
};

export function ServiceHistoryFilters({ q, type, onQChange, onTypeChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Vyhľadať zákazníka, ŠPZ, vozidlo alebo typ servisu..."
          className="border-brand-border bg-brand-bg pl-9 text-white placeholder:text-white/40"
        />
      </div>
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full border-brand-border bg-brand-bg text-white sm:w-64">
          <SelectValue placeholder="Typ servisu" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Všetky typy</SelectItem>
          {SERVICE_TYPE_OPTIONS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
