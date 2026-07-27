import { queryOptions } from "@tanstack/react-query";

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

export const plannedTasksQuery = queryOptions({
  queryKey: ["scheduled-tasks", "active"],
  queryFn: async (): Promise<PlannedTask[]> => {
    return window.electronAPI.db.getAllActiveTasks();
  },
});

export const vehicleScheduledTasksQuery = (vehicleId: string) =>
  queryOptions({
    queryKey: ["scheduled-tasks", "vehicle", vehicleId],
    queryFn: async (): Promise<PlannedTask[]> => {
      return window.electronAPI.db.getScheduledTasks(vehicleId);
    },
  });
