import type { VehicleDetail } from "@/lib/queries/vehicles";

const FIELDS: { label: string; key: keyof VehicleDetail }[] = [
  { label: "Motor", key: "engine" },
  { label: "Prevodovka", key: "transmission" },
  { label: "Pohon", key: "drive" },
  { label: "Výkon", key: "power" },
  { label: "Objem oleja", key: "oil_volume" },
  { label: "Rozmer pneu", key: "tire_size" },
  { label: "Typ paliva", key: "fuel_type" },
];

export function VehicleSpecsCard({ vehicle }: { vehicle: VehicleDetail }) {
  const rows = FIELDS.map((f) => ({ label: f.label, value: vehicle[f.key] as string | null })).filter(
    (r) => r.value && String(r.value).trim().length > 0,
  );

  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface p-5">
      <h2 className="text-lg font-semibold text-white">Technické špecifikácie</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-white/50">Žiadne údaje.</p>
      ) : (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-white/50">{r.label}</dt>
              <dd className="text-white">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
