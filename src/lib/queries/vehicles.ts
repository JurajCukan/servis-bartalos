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

export type CustomerFull = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

export type VehicleDetail = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  license_plate: string;
  current_mileage: number;
  status: VehicleStatus;
  photo_url: string | null;
  notes: string | null;
  engine: string | null;
  transmission: string | null;
  power: string | null;
  drive: string | null;
  oil_volume: string | null;
  tire_size: string | null;
  fuel_type: string | null;
  created_at: string;
  customer: CustomerFull | null;
};

export const vehicleDetailQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["vehicle", vehicleId],
    queryFn: async (): Promise<VehicleDetail | null> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "id, brand, model, year, vin, license_plate, current_mileage, status, photo_url, notes, engine, transmission, power, drive, oil_volume, tire_size, fuel_type, created_at, customer:customers(id, first_name, last_name, phone, email, notes)",
        )
        .eq("id", vehicleId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as VehicleDetail | null;
    },
  });

export type ServiceRecord = {
  id: string;
  vehicle_id: string;
  date: string;
  mileage_at_service: number;
  service_type: string;
  title: string;
  description: string;
  parts_replaced: string | null;
  price: number | null;
  technician: string | null;
  next_service_km: number | null;
  next_service_date: string | null;
  photo_paths: string[];
  created_at: string;
};

export const serviceHistoryQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["vehicle", vehicleId, "service-records"],
    queryFn: async (): Promise<ServiceRecord[]> => {
      const { data, error } = await supabase
        .from("service_records")
        .select(
          "id, vehicle_id, date, mileage_at_service, service_type, title, description, parts_replaced, price, technician, next_service_km, next_service_date, photo_paths, created_at",
        )
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        photo_paths: (r as { photo_paths?: string[] | null }).photo_paths ?? [],
      })) as ServiceRecord[];
    },
  });
