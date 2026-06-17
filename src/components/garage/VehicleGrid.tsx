import { VehicleCard } from "./VehicleCard";
import type { VehicleWithCustomer } from "@/lib/queries/vehicles";

export function VehicleGrid({
  vehicles,
  onSelect,
}: {
  vehicles: VehicleWithCustomer[];
  onSelect?: (v: VehicleWithCustomer) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} vehicle={v} onClick={onSelect} />
      ))}
    </div>
  );
}
