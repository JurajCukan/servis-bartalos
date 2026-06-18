GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT ON public.customers TO anon;

CREATE POLICY "Vehicles: anon read" ON public.vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "Customers: anon read" ON public.customers FOR SELECT TO anon USING (true);