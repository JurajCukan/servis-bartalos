import { queryOptions } from "@tanstack/react-query";
import type { RecordModel } from "pocketbase";
import pb from "@/lib/pocketbase";

export type TaskPriority = "Nízka" | "Stredná" | "Vysoká";
export type TaskStatus = "Čakajúce" | "Dokončené" | "Zrušené";

export type PlannedTask = {
  id: string;
  vehicle_id: string;
  planned_date: string;
  planned_mileage: number | null;
  task_type: string | null;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    license_plate: string;
    customer: { first_name: string; last_name: string } | null;
  } | null;
};

function mapTask(r: RecordModel): PlannedTask {
  const veh = r.expand?.vehicle as RecordModel | undefined;
  const cust = veh?.expand?.customer as RecordModel | undefined;
  return {
    id: r.id,
    vehicle_id: r.vehicle,
    planned_date: String(r.planned_date ?? "").slice(0, 10),
    planned_mileage:
      r.planned_mileage == null || r.planned_mileage === ""
        ? null
        : Number(r.planned_mileage),
    task_type: r.task_type ?? null,
    description: r.description ?? "",
    priority: (r.priority as TaskPriority) ?? "Stredná",
    status: (r.status as TaskStatus) ?? "Čakajúce",
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
}

export const plannedTasksQuery = queryOptions({
  queryKey: ["scheduled-tasks", "active"],
  queryFn: async (): Promise<PlannedTask[]> => {
    const list = await pb.collection("scheduled_tasks").getFullList<RecordModel>({
      filter: 'status != "Zrušené"',
      sort: "planned_date",
      expand: "vehicle,vehicle.customer",
    });
    return list.map(mapTask);
  },
});

export const vehicleScheduledTasksQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["scheduled-tasks", "vehicle", vehicleId],
    queryFn: async (): Promise<PlannedTask[]> => {
      const list = await pb
        .collection("scheduled_tasks")
        .getFullList<RecordModel>({
          filter: pb.filter("vehicle = {:vid}", { vid: vehicleId }),
          sort: "planned_date",
        });
      return list.map(mapTask);
    },
  });
