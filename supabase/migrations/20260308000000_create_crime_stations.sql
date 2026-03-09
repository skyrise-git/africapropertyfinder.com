-- Crime stations table for SAPS safety intelligence data
CREATE TABLE crime_stations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  station text NOT NULL UNIQUE,
  district text NOT NULL,
  province text NOT NULL,
  safety_rating smallint NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
  safety_label text NOT NULL CHECK (
    safety_label IN ('Very Safe', 'Safe', 'Moderate', 'High Risk', 'Very High Risk')
  ),
  crime_index numeric(5,1) NOT NULL CHECK (crime_index >= 0 AND crime_index <= 100),
  total_serious_crimes_q1_2025 integer NOT NULL DEFAULT 0,
  total_serious_crimes_q1_2024 integer NOT NULL DEFAULT 0,
  trend text NOT NULL CHECK (trend IN ('Improving', 'Stable', 'Worsening')),
  crime_breakdown jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crime_stations_province ON crime_stations (province);
CREATE INDEX idx_crime_stations_district ON crime_stations (district);
CREATE INDEX idx_crime_stations_safety_rating ON crime_stations (safety_rating);
CREATE INDEX idx_crime_stations_trend ON crime_stations (trend);
CREATE INDEX idx_crime_stations_station_lower ON crime_stations (lower(station));

-- Enable Row Level Security with public read access
ALTER TABLE crime_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON crime_stations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crime_stations_updated_at
  BEFORE UPDATE ON crime_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE crime_stations IS 'SAPS crime statistics per police station — Q1 2025/2026';
COMMENT ON COLUMN crime_stations.safety_rating IS '1 = Very High Risk, 5 = Very Safe';
COMMENT ON COLUMN crime_stations.crime_index IS 'Normalised index 0–100 (100 = highest crime)';
COMMENT ON COLUMN crime_stations.crime_breakdown IS 'JSON object mapping crime category → count';
