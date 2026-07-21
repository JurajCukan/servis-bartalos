import { queryOptions } from "@tanstack/react-query";
import pb, { fileUrl } from "@/lib/pocketbase";
import type { RecordModel } from "pocketbase";

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
  customer: { first_name: string; last_name: string; phone: string } | null;
};

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
  photo: string | null;
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
  photos: string[];
  photo_urls: string[];
  created_at: string;
};

function emptyOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function numOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function dateOrNull(v: unknown): string | null {
  if (!v) return null;
  const s = String(v);
  // PocketBase returns ISO strings; trim to yyyy-mm-dd for date-only fields
  return s.slice(0, 10);
}

function mapCustomer(r: RecordModel | null | undefined): CustomerFull | null {
  if (!r) return null;
  return {
    id: r.id,
    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",
    phone: r.phone ?? "",
    email: emptyOrNull(r.email),
    notes: emptyOrNull(r.notes),
  };
}

function mapVehicleList(r: RecordModel): VehicleWithCustomer {
  const customerRec: RecordModel | undefined = r.expand?.customer;
  return {
    id: r.id,
    brand: r.brand ?? "",
    model: r.model ?? "",
    year: numOrNull(r.year),
    vin: emptyOrNull(r.vin),
    license_plate: r.license_plate ?? "",
    current_mileage: Number(r.current_mileage ?? 0),
    fuel_type: emptyOrNull(r.fuel_type),
    photo_url: r.photo ? fileUrl(r, r.photo) : null,
    status: (r.status as VehicleStatus) ?? "OK",
    created_at: r.created,
    customer: customerRec
      ? {
          first_name: customerRec.first_name ?? "",
          last_name: customerRec.last_name ?? "",
          phone: customerRec.phone ?? "",
        }
      : null,
  };
}

function mapVehicleDetail(r: RecordModel): VehicleDetail {
  return {
    id: r.id,
    brand: r.brand ?? "",
    model: r.model ?? "",
    year: numOrNull(r.year),
    vin: emptyOrNull(r.vin),
    license_plate: r.license_plate ?? "",
    current_mileage: Number(r.current_mileage ?? 0),
    status: (r.status as VehicleStatus) ?? "OK",
    photo: r.photo || null,
    photo_url: r.photo ? fileUrl(r, r.photo) : null,
    notes: emptyOrNull(r.notes),
    engine: emptyOrNull(r.engine),
    transmission: emptyOrNull(r.transmission),
    power: emptyOrNull(r.power),
    drive: emptyOrNull(r.drive),
    oil_volume: emptyOrNull(r.oil_volume),
    tire_size: emptyOrNull(r.tire_size),
    fuel_type: emptyOrNull(r.fuel_type),
    created_at: r.created,
    customer: mapCustomer(r.expand?.customer as RecordModel | undefined),
  };
}

export function mapServiceRecord(r: RecordModel): ServiceRecord {
  const photos: string[] = Array.isArray(r.photos) ? r.photos : [];
  return {
    id: r.id,
    vehicle_id: r.vehicle,
    date: dateOrNull(r.date) ?? "",
    mileage_at_service: Number(r.mileage_at_service ?? 0),
    service_type: r.service_type ?? "",
    title: r.title ?? "",
    description: r.description ?? "",
    parts_replaced: emptyOrNull(r.parts_replaced),
    price: numOrNull(r.price),
    technician: emptyOrNull(r.technician),
    next_service_km: numOrNull(r.next_service_km),
    next_service_date: dateOrNull(r.next_service_date),
    photos,
    photo_urls: photos.map((p) => fileUrl(r, p)),
    created_at: r.created,
  };
}

export const vehiclesWithCustomersQuery = queryOptions({
  queryKey: ["vehicles", "with-customers"],
  queryFn: async (): Promise<VehicleWithCustomer[]> => {
    const list = await pb.collection("vehicles").getFullList<RecordModel>({
      expand: "customer",
      sort: "-created",
    });
    return list.map(mapVehicleList);
  },
});

export const vehicleDetailQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["vehicle", vehicleId],
    queryFn: async (): Promise<VehicleDetail | null> => {
      try {
        const r = await pb
          .collection("vehicles")
          .getOne<RecordModel>(vehicleId, { expand: "customer" });
        return mapVehicleDetail(r);
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 404) return null;
        throw e;
      }
    },
  });

export const serviceHistoryQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["vehicle", vehicleId, "service-records"],
    queryFn: async (): Promise<ServiceRecord[]> => {
      const list = await pb.collection("service_records").getFullList<RecordModel>({
        filter: pb.filter("vehicle = {:vid}", { vid: vehicleId }),
        sort: "-date,-created",
      });
      return list.map(mapServiceRecord);
    },
  });
