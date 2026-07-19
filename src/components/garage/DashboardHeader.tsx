import { Plus } from "lucide-react";

export function DashboardHeader({ onAddVehicle }: { onAddVehicle: () => void }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-fg sm:text-3xl">
          Moja Garáž
        </h1>
        <p className="text-sm text-brand-fg-muted">Spravujte a sledujte stav vozidiel v servise.</p>
      </div>
      <button
        type="button"
        onClick={onAddVehicle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 sm:w-auto sm:self-start"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Pridať vozidlo
      </button>
    </header>
  );
}
