import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase
      .from("scheduled_tasks")
      .select(
        "id, vehicle_id, planned_date, planned_mileage, task_type, description, priority, status, vehicle:vehicles(id, brand, model, license_plate, customer:customers(first_name, last_name))",
      )
      .neq("status", "Zrušené")
      .order("planned_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as PlannedTask[];
  },
});
