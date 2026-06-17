
CREATE POLICY "Vehicle photos: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-photos');
CREATE POLICY "Vehicle photos: insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos');
CREATE POLICY "Vehicle photos: update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-photos') WITH CHECK (bucket_id = 'vehicle-photos');
CREATE POLICY "Vehicle photos: delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Service photos: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'service-photos');
CREATE POLICY "Service photos: insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-photos');
CREATE POLICY "Service photos: update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-photos') WITH CHECK (bucket_id = 'service-photos');
CREATE POLICY "Service photos: delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-photos');
