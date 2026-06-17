import { queryOptions } from "@tanstack/react-query";
import type { RecordModel } from "pocketbase";
import pb from "@/lib/pocketbase";
import { mapServiceRecord, type ServiceRecord } from "./vehicles";

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
    const list = await pb.collection("service_records").getFullList<RecordModel>({
      expand: "vehicle,vehicle.customer",
      sort: "-date,-created",
    });
    return list.map((r) => {
      const base = mapServiceRecord(r);
      const veh = r.expand?.vehicle as RecordModel | undefined;
      const cust = veh?.expand?.customer as RecordModel | undefined;
      return {
        ...base,
        vehicle: veh
          ? {
              id: veh.id,
              brand: veh.brand ?? "",
              model: veh.model ?? "",
              license_plate: veh.license_plate ?? "",
              customer: cust
                ? {
                    first_name: cust.first_name ?? "",
                    last_name: cust.last_name ?? "",
                  }
                : null,
            }
          : null,
      };
    });
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
