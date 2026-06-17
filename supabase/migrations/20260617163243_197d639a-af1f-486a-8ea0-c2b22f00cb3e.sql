CREATE POLICY "Service records: anon delete" ON public.service_records FOR DELETE TO anon USING (true);
CREATE POLICY "Scheduled tasks: anon delete" ON public.scheduled_tasks FOR DELETE TO anon USING (true);
CREATE POLICY "Vehicles: anon delete" ON public.vehicles FOR DELETE TO anon USING (true);
GRANT DELETE ON public.service_records TO anon;
GRANT DELETE ON public.scheduled_tasks TO anon;
GRANT DELETE ON public.vehicles TO anon;