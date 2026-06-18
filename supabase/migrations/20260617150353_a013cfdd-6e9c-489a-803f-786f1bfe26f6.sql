CREATE POLICY "Scheduled tasks: anon select" ON public.scheduled_tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Scheduled tasks: anon update" ON public.scheduled_tasks FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT SELECT, UPDATE ON public.scheduled_tasks TO anon;