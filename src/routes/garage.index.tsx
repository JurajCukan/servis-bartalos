import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app/AppShell";
import { DashboardHeader } from "@/components/garage/DashboardHeader";
import { VehicleSearchBar } from "@/components/garage/VehicleSearchBar";
import { VehicleFilters } from "@/components/garage/VehicleFilters";
import { VehicleSort, type SortKey } from "@/components/garage/VehicleSort";
import { VehicleGrid } from "@/components/garage/VehicleGrid";
import { EmptyState } from "@/components/garage/EmptyState";
import { DashboardLoadingSkeleton } from "@/components/garage/LoadingSkeleton";
import { AddVehicleDialog } from "@/components/garage/add/AddVehicleDialog";
import { vehiclesWithCustomersQuery, type VehicleWithCustomer } from "@/lib/queries/vehicles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/garage/")({
  head: () => ({ meta: [{ title: "Moja Garáž — Servisná knižka Bartalos" }] }),
  component: GaragePage,
});

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function matchesSearch(v: VehicleWithCustomer, q: string) {
  if (!q) return true;
  const haystack = normalize(
    [
      v.customer?.first_name ?? "",
      v.customer?.last_name ?? "",
      v.license_plate,
      v.vin ?? "",
      v.brand,
      v.model,
    ].join(" "),
  );
  return haystack.includes(q);
}

function GaragePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fuel, setFuel] = useState("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [addOpen, setAddOpen] = useState(false);
  const debouncedSearch = normalize(useDebouncedValue(search, 300));

  const { data: vehicles, isLoading, error } = useQuery(vehiclesWithCustomersQuery);

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    const list = vehicles.filter(
      (v) =>
        (status === "all" || v.status === status) &&
        (fuel === "all" || v.fuel_type === fuel) &&
        matchesSearch(v, debouncedSearch),
    );
    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "az":
        sorted.sort((a, b) =>
          `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "sk"),
        );
        break;
      case "km_asc":
        sorted.sort((a, b) => a.current_mileage - b.current_mileage);
        break;
      case "km_desc":
        sorted.sort((a, b) => b.current_mileage - a.current_mileage);
        break;
      default:
        sorted.sort((a, b) => {
          const aUrgent = a.status === "SERVIS NUTNÝ" ? 0 : 1;
          const bUrgent = b.status === "SERVIS NUTNÝ" ? 0 : 1;
          if (aUrgent !== bUrgent) return aUrgent - bUrgent;
          return b.created_at.localeCompare(a.created_at);
        });
    }
    return sorted;
  }, [vehicles, status, fuel, debouncedSearch, sort]);

  const openAdd = () => setAddOpen(true);
  const openVehicle = (v: { id: string }) =>
    navigate({ to: "/garage/$vehicleId", params: { vehicleId: v.id } });

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <DashboardHeader onAddVehicle={openAdd} />

        {isLoading ? (
          <DashboardLoadingSkeleton />
        ) : error ? (
          <EmptyState
            title="Nepodarilo sa načítať vozidlá"
            description="Skúste obnoviť stránku."
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <VehicleSearchBar value={search} onChange={setSearch} />
              </div>
              <VehicleFilters
                status={status}
                fuel={fuel}
                onStatusChange={setStatus}
                onFuelChange={setFuel}
              />
              <VehicleSort value={sort} onChange={setSort} />
            </div>

            {vehicles && vehicles.length === 0 ? (
              <EmptyState
                title="Zatiaľ tu nie sú žiadne vozidlá"
                description="Pridajte prvé vozidlo a začnite viesť servisnú históriu digitálne."
                action={
                  <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Pridať vozidlo
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Žiadne výsledky"
                description="Skúste upraviť vyhľadávanie alebo filtre."
              />
            ) : (
              <VehicleGrid vehicles={filtered} onSelect={openVehicle} />
            )}
          </>
        )}
      </div>
      <AddVehicleDialog open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}
