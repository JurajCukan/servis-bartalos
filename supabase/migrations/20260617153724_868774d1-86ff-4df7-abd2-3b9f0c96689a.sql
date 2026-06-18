CREATE POLICY "Customers: anon update" ON public.customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT UPDATE ON public.customers TO anon;