import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VehicleStatus = "OK" | "SERVIS NUTNÝ" | "NAPLÁNOVANÉ" | "ARCHÍV";

export type VehicleWithCustomer = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  license_plate: string;
  current_mileage: number;
  fuel_type: string | null;
  photo_url: string | null;
  status: VehicleStatus;
  created_at: string;
  customer: { first_name: string; last_name: string } | null;
};

export const vehiclesWithCustomersQuery = queryOptions({
  queryKey: ["vehicles", "with-customers"],
  queryFn: async (): Promise<VehicleWithCustomer[]> => {
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "id, brand, model, year, vin, license_plate, current_mileage, fuel_type, photo_url, status, created_at, customer:customers(first_name, last_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as VehicleWithCustomer[];
  },
});
