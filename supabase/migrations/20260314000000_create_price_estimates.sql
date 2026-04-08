-- Price estimates table for APF market valuations
-- Supports both manual overrides and computed/derived estimates

CREATE TABLE price_estimates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Can be linked to a specific property, an area, or both
  "propertyId" uuid REFERENCES properties(id) ON DELETE CASCADE,
  city text,
  province text,
  "propertyType" text,

  -- Estimate values (in ZAR)
  "estimateLow" numeric NOT NULL,
  "estimateMid" numeric NOT NULL,
  "estimateHigh" numeric NOT NULL,

  -- Market context
  "yoyGrowthPct" numeric(5,2) NOT NULL DEFAULT 0,
  "demandLevel" text NOT NULL DEFAULT 'Moderate' CHECK ("demandLevel" IN ('Low', 'Growing', 'Moderate', 'High', 'Very High')),
  "avgPricePerSqm" numeric,
  "comparableCount" integer DEFAULT 0,

  -- Trend data (quarterly snapshots stored as JSONB array)
  -- e.g. [{"quarter":"Q1 2025","avgPrice":2500000},{"quarter":"Q4 2024","avgPrice":2350000}]
  "priceTrend" jsonb DEFAULT '[]',

  -- Source: 'manual' for admin-entered, 'derived' for computed from listings
  source text NOT NULL DEFAULT 'derived' CHECK (source IN ('manual', 'derived', 'hybrid')),
  notes text,

  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX idx_price_estimates_property ON price_estimates ("propertyId");
CREATE INDEX idx_price_estimates_city ON price_estimates (city);
CREATE INDEX idx_price_estimates_province ON price_estimates (province);
CREATE INDEX idx_price_estimates_type ON price_estimates ("propertyType");

ALTER TABLE price_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price estimates are viewable by everyone"
  ON price_estimates FOR SELECT USING (true);

CREATE POLICY "Admins can manage price estimates"
  ON price_estimates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE TRIGGER price_estimates_updated_at
  BEFORE UPDATE ON price_estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE price_estimates IS 'APF market price estimates — manual overrides and derived valuations';
COMMENT ON COLUMN price_estimates.source IS 'manual = admin-entered, derived = computed from comparable listings, hybrid = derived then adjusted';
COMMENT ON COLUMN price_estimates."priceTrend" IS 'JSON array of quarterly price snapshots for trend visualization';
