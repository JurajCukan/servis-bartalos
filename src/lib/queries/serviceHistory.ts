import { queryOptions } from "@tanstack/react-query";
import { type ServiceRecord } from "./vehicles";

export type ServiceHistoryItem = ServiceRecord & {
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
    return window.electronAPI.db.getAllServiceRecords();
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
