alter table public.vehicles add column if not exists photo_path text null;

create policy "vehicle-photos anon read" on storage.objects for select using (bucket_id = 'vehicle-photos');
create policy "vehicle-photos anon insert" on storage.objects for insert with check (bucket_id = 'vehicle-photos');
create policy "vehicle-photos anon delete" on storage.objects for delete using (bucket_id = 'vehicle-photos');