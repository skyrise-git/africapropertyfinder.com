-- Admin portal: crime_stations write RLS, price_estimates, appointments workflow, property moderation

-- ---------------------------------------------------------------------------
-- crime_stations: allow admin + staff to manage rows (public read unchanged)
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins and staff can insert crime_stations"
  ON crime_stations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins and staff can update crime_stations"
  ON crime_stations FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins and staff can delete crime_stations"
  ON crime_stations FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ---------------------------------------------------------------------------
-- price_estimates: APF manual / derived estimates per area
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL DEFAULT 'South Africa',
  province text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  suburb text NOT NULL DEFAULT '',
  "listingType" text CHECK (
    "listingType" IS NULL OR "listingType" IN ('sale', 'rent', 'student-housing')
  ),
  "propertyType" text,
  "estimateLow" numeric,
  "estimateMid" numeric,
  "estimateHigh" numeric,
  "yoyGrowthPct" numeric,
  "demandLevel" text,
  "priceTrend" text,
  "forecast6m" numeric,
  "forecast12m" numeric,
  "forecast36m" numeric,
  "historicalPrices" jsonb NOT NULL DEFAULT '[]',
  "comparableCount" integer,
  "avgPricePerSqm" numeric,
  source text NOT NULL DEFAULT 'manual',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_estimates_location
  ON price_estimates (country, province, city, suburb);

ALTER TABLE price_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price_estimates"
  ON price_estimates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and staff can insert price_estimates"
  ON price_estimates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins and staff can update price_estimates"
  ON price_estimates FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins and staff can delete price_estimates"
  ON price_estimates FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE OR REPLACE FUNCTION price_estimates_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS price_estimates_updated_at ON price_estimates;
CREATE TRIGGER price_estimates_updated_at
  BEFORE UPDATE ON price_estimates
  FOR EACH ROW
  EXECUTE FUNCTION price_estimates_set_updated_at();

-- ---------------------------------------------------------------------------
-- appointments: status + notes + admin/staff update/delete
-- ---------------------------------------------------------------------------
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  ALTER TABLE appointments
    ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

CREATE POLICY "Admins and staff can update appointments"
  ON appointments FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins and staff can delete appointments"
  ON appointments FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ---------------------------------------------------------------------------
-- properties: moderation flags
-- ---------------------------------------------------------------------------
ALTER TABLE properties ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  ALTER TABLE properties
    ADD CONSTRAINT properties_status_check
    CHECK (status IN ('active', 'inactive', 'pending', 'booked', 'sold'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS "isBooked" boolean NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties (featured) WHERE featured = true;
