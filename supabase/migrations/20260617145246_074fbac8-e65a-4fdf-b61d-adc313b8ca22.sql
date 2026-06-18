GRANT INSERT ON public.service_records TO anon;
CREATE POLICY "Service records: anon insert" ON public.service_records
  FOR INSERT TO anon WITH CHECK (true);

GRANT UPDATE (current_mileage, updated_at) ON public.vehicles TO anon;
CREATE POLICY "Vehicles: anon update mileage" ON public.vehicles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT INSERT, SELECT ON public.scheduled_tasks TO anon;
CREATE POLICY "Scheduled tasks: anon insert" ON public.scheduled_tasks
  FOR INSERT TO anon WITH CHECK (true);