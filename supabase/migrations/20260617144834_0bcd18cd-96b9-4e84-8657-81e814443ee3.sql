GRANT SELECT ON public.service_records TO anon;
CREATE POLICY "Service records: anon read" ON public.service_records FOR SELECT TO anon USING (true);