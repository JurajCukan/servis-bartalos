import { queryOptions } from "@tanstack/react-query";

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

export function mapServiceRecord(r: any): ServiceRecord {
  return r as ServiceRecord;
}

export const vehiclesWithCustomersQuery = queryOptions({
  queryKey: ["vehicles", "with-customers"],
  queryFn: async (): Promise<VehicleWithCustomer[]> => {
    return window.electronAPI.db.getVehiclesWithCustomers();
  },
});

export const vehicleDetailQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["vehicle", vehicleId],
    queryFn: async (): Promise<VehicleDetail | null> => {
      return window.electronAPI.db.getVehicleDetail(vehicleId);
    },
  });

export const serviceHistoryQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["vehicle", vehicleId, "service-records"],
    queryFn: async (): Promise<ServiceRecord[]> => {
      return window.electronAPI.db.getServiceRecords(vehicleId);
    },
  });
