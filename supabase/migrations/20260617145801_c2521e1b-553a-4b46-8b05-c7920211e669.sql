CREATE POLICY "Customers: anon insert" ON public.customers FOR INSERT TO anon WITH CHECK (true);
GRANT INSERT ON public.customers TO anon;

CREATE POLICY "Vehicles: anon insert" ON public.vehicles FOR INSERT TO anon WITH CHECK (true);
GRANT INSERT ON public.vehicles TO anon;