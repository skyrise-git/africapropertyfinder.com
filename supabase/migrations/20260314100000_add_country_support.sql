-- Add country support across all tables
-- Defaults to 'South Africa' for existing data

-- 1. Countries reference table
CREATE TABLE countries (
  code text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are viewable by everyone"
  ON countries FOR SELECT USING (true);

CREATE POLICY "Admins can manage countries"
  ON countries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO countries (code, name) VALUES
  ('ZA', 'South Africa'),
  ('ZW', 'Zimbabwe')
ON CONFLICT (code) DO NOTHING;

-- 2. Add country to crime_stations
ALTER TABLE crime_stations ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'South Africa';
CREATE INDEX IF NOT EXISTS idx_crime_stations_country ON crime_stations (country);

-- Drop old unique constraint on station name and create new one scoped to country
ALTER TABLE crime_stations DROP CONSTRAINT IF EXISTS crime_stations_station_key;
ALTER TABLE crime_stations ADD CONSTRAINT crime_stations_country_station_key UNIQUE (country, station);

-- 3. Add country to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'South Africa';
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties (country);

-- 4. Add country to price_estimates
ALTER TABLE price_estimates ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'South Africa';
CREATE INDEX IF NOT EXISTS idx_price_estimates_country ON price_estimates (country);

-- 5. Seed Zimbabwe placeholder safety data
INSERT INTO crime_stations (station, district, province, country, safety_rating, safety_label, crime_index, total_serious_crimes_q1_2025, total_serious_crimes_q1_2024, trend, crime_breakdown)
VALUES
  ('Harare Central', 'Harare Metropolitan', 'Harare', 'Zimbabwe', 2, 'High Risk', 65.0, 420, 450, 'Improving', '{"Robbery":85,"Assault":120,"Burglary":95,"Theft":180,"Carjacking":25}'::jsonb),
  ('Bulawayo Central', 'Bulawayo Metropolitan', 'Bulawayo', 'Zimbabwe', 3, 'Moderate', 42.0, 280, 310, 'Improving', '{"Robbery":45,"Assault":80,"Burglary":65,"Theft":110,"Carjacking":12}'::jsonb),
  ('Mutare', 'Mutare District', 'Manicaland', 'Zimbabwe', 4, 'Safe', 22.0, 95, 105, 'Improving', '{"Robbery":12,"Assault":30,"Burglary":25,"Theft":40}'::jsonb),
  ('Gweru', 'Gweru District', 'Midlands', 'Zimbabwe', 3, 'Moderate', 35.0, 180, 195, 'Improving', '{"Robbery":28,"Assault":55,"Burglary":40,"Theft":75}'::jsonb),
  ('Masvingo', 'Masvingo District', 'Masvingo', 'Zimbabwe', 4, 'Safe', 18.0, 78, 82, 'Stable', '{"Robbery":8,"Assault":22,"Burglary":18,"Theft":35}'::jsonb),
  ('Victoria Falls', 'Hwange District', 'Matabeleland North', 'Zimbabwe', 5, 'Very Safe', 8.0, 35, 40, 'Improving', '{"Robbery":3,"Assault":8,"Burglary":10,"Theft":18}'::jsonb),
  ('Chitungwiza', 'Chitungwiza District', 'Harare', 'Zimbabwe', 2, 'High Risk', 58.0, 350, 320, 'Worsening', '{"Robbery":70,"Assault":95,"Burglary":80,"Theft":140,"Carjacking":18}'::jsonb),
  ('Kwekwe', 'Kwekwe District', 'Midlands', 'Zimbabwe', 3, 'Moderate', 38.0, 165, 180, 'Improving', '{"Robbery":22,"Assault":48,"Burglary":35,"Theft":70}'::jsonb),
  ('Kadoma', 'Kadoma District', 'Mashonaland West', 'Zimbabwe', 4, 'Safe', 20.0, 85, 90, 'Improving', '{"Robbery":10,"Assault":25,"Burglary":20,"Theft":38}'::jsonb),
  ('Chinhoyi', 'Makonde District', 'Mashonaland West', 'Zimbabwe', 4, 'Safe', 19.0, 80, 88, 'Improving', '{"Robbery":9,"Assault":22,"Burglary":18,"Theft":35}'::jsonb)
ON CONFLICT (country, station) DO UPDATE SET
  district = EXCLUDED.district,
  province = EXCLUDED.province,
  safety_rating = EXCLUDED.safety_rating,
  safety_label = EXCLUDED.safety_label,
  crime_index = EXCLUDED.crime_index,
  total_serious_crimes_q1_2025 = EXCLUDED.total_serious_crimes_q1_2025,
  total_serious_crimes_q1_2024 = EXCLUDED.total_serious_crimes_q1_2024,
  trend = EXCLUDED.trend,
  crime_breakdown = EXCLUDED.crime_breakdown,
  updated_at = now();
