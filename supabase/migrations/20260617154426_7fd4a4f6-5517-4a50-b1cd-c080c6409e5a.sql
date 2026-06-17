CREATE POLICY "Service records: anon update" ON public.service_records FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT UPDATE ON public.service_records TO anon;