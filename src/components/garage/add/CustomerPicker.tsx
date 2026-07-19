import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export type PickedCustomer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
};

export function CustomerPicker({
  value,
  onChange,
}: {
  value: PickedCustomer | null;
  onChange: (c: PickedCustomer | null) => void;
}) {
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim(), 250);

  const { data: results, isFetching } = useQuery({
    queryKey: ["customers", "search", q],
    queryFn: async (): Promise<PickedCustomer[]> => {
      let req = supabase
        .from("customers")
        .select("id, first_name, last_name, phone")
        .order("last_name", { ascending: true })
        .limit(20);
      if (q.length > 0) {
        const like = `%${q}%`;
        req = req.or(`first_name.ilike.${like},last_name.ilike.${like},phone.ilike.${like}`);
      }
      const { data, error } = await req;
      if (error) throw error;
      return (data ?? []) as PickedCustomer[];
    },
  });

  const inputCls =
    "bg-brand-bg border-brand-border text-brand-fg placeholder:text-brand-fg-subtle focus-visible:ring-brand-accent";

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-fg-subtle" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hľadať podľa mena, priezviska alebo telefónu"
          className={`pl-9 ${inputCls}`}
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-brand-border">
        {isFetching && !results ? (
          <p className="px-3 py-4 text-sm text-brand-fg-muted">Načítavam…</p>
        ) : !results || results.length === 0 ? (
          <p className="px-3 py-4 text-sm text-brand-fg-muted">Žiadni zákazníci.</p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {results.map((c) => {
              const selected = value?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onChange(c)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "bg-brand-accent/15 text-brand-fg"
                        : "text-brand-fg hover:bg-brand-surface"
                    }`}
                  >
                    <span className="font-medium">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-xs text-brand-fg-muted">{c.phone}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {value && (
        <p className="text-xs text-brand-fg-muted">
          Vybraný zákazník:{" "}
          <span className="text-brand-fg">
            {value.first_name} {value.last_name}
          </span>
        </p>
      )}
    </div>
  );
}
