import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ServiceHistoryItem = {
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
  created_at: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    license_plate: string;
    customer: { first_name: string; last_name: string } | null;
  } | null;
};

export const serviceHistoryQuery = queryOptions({
  queryKey: ["service-history", "all"],
  queryFn: async (): Promise<ServiceHistoryItem[]> => {
    const { data, error } = await supabase
      .from("service_records")
      .select(
        "id, vehicle_id, date, mileage_at_service, service_type, title, description, parts_replaced, price, technician, next_service_km, next_service_date, created_at, vehicle:vehicles(id, brand, model, license_plate, customer:customers(first_name, last_name))",
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ServiceHistoryItem[];
  },
});

export const SERVICE_TYPE_OPTIONS = [
  "Kompletný servis",
  "Výmena oleja",
  "Výmena bŕzd",
  "Výmena pneumatík",
  "Oprava – motor",
  "Oprava – elektroinštalácia",
  "Oprava – prevodovka",
  "Oprava – klimatizácia",
  "Kontrola / diagnostika",
  "STK príprava",
  "Iné",
] as const;
