
-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  role text NOT NULL DEFAULT 'technik' CHECK (role IN ('technik','manažér')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: self select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Profiles: self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles: self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers: auth all" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER customers_set_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL,
  year integer,
  vin text,
  license_plate text NOT NULL UNIQUE,
  current_mileage integer NOT NULL,
  engine text,
  transmission text,
  drive text,
  power text,
  oil_volume text,
  tire_size text,
  fuel_type text,
  photo_url text,
  status text NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','SERVIS NUTNÝ','NAPLÁNOVANÉ','ARCHÍV')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicles: auth all" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- service_records
CREATE TABLE public.service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date date NOT NULL,
  mileage_at_service integer NOT NULL,
  service_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  parts_replaced text,
  price numeric(10,2),
  technician text,
  next_service_km integer,
  next_service_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_records TO authenticated;
GRANT ALL ON public.service_records TO service_role;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service records: auth all" ON public.service_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER service_records_set_updated_at BEFORE UPDATE ON public.service_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- scheduled_tasks
CREATE TABLE public.scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  planned_date date NOT NULL,
  planned_mileage integer,
  task_type text,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'Stredná' CHECK (priority IN ('Nízka','Stredná','Vysoká')),
  status text NOT NULL DEFAULT 'Čakajúce' CHECK (status IN ('Čakajúce','Potvrdené','Prebieha','Dokončené','Zrušené')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_tasks TO authenticated;
GRANT ALL ON public.scheduled_tasks TO service_role;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scheduled tasks: auth all" ON public.scheduled_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER scheduled_tasks_set_updated_at BEFORE UPDATE ON public.scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
