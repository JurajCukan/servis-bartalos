ALTER TABLE public.service_records
  ADD COLUMN IF NOT EXISTS photo_paths text[] NOT NULL DEFAULT '{}';

CREATE POLICY "service-photos anon read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'service-photos');

CREATE POLICY "service-photos anon insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "service-photos anon delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'service-photos');

CREATE POLICY "service-photos auth all" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'service-photos') WITH CHECK (bucket_id = 'service-photos');