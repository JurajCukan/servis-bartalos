import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROWS: { label: string; value: string }[] = [
  { label: "Názov aplikácie", value: "Servisná knižka" },
  { label: "Prevádzka", value: "Autoservis Bartalos" },
  { label: "Režim", value: "Lokálna prevádzka" },
  { label: "Verzia", value: "MVP" },
];

export function AppInfoCard() {
  return (
    <Card className="border-brand-border bg-brand-surface text-white">
      <CardHeader>
        <CardTitle className="text-white">Aplikácia</CardTitle>
        <CardDescription className="text-white/60">
          Základné informácie o tejto inštalácii.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-brand-border">
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt className="text-sm text-white/60">{row.label}</dt>
              <dd className="text-sm font-medium text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
