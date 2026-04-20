-- Agent micro-sites, email subscribers, price history, property views, neighborhood guides,
-- optional propertyId on contacts, email campaign drafts

-- 1) Agent profile micro-site fields
ALTER TABLE agent_profiles
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS banner_image text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS microsite_enabled boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_profiles_slug ON agent_profiles (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_profiles_microsite ON agent_profiles (microsite_enabled) WHERE microsite_enabled = true;

-- 2) Contacts: optional link to a listing (for future inquiry attribution)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS "propertyId" uuid REFERENCES properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_property ON contacts ("propertyId");

-- 3) Email subscribers (global + per-agent)
CREATE TABLE IF NOT EXISTS email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}',
  verified boolean NOT NULL DEFAULT false,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_subscribers_email_global
  ON email_subscribers (lower(trim(email))) WHERE agent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS email_subscribers_email_per_agent
  ON email_subscribers (lower(trim(email)), agent_id) WHERE agent_id IS NOT NULL;

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe email" ON email_subscribers;
CREATE POLICY "Anyone can subscribe email"
  ON email_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins staff view all subscribers" ON email_subscribers;
CREATE POLICY "Admins staff view all subscribers"
  ON email_subscribers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "Agents view own subscribers" ON email_subscribers;
CREATE POLICY "Agents view own subscribers"
  ON email_subscribers FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

DROP POLICY IF EXISTS "Admins staff manage subscribers" ON email_subscribers;
CREATE POLICY "Admins staff manage subscribers"
  ON email_subscribers FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- 4) Stored bulk-email drafts (sending wired later)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  recipient_filter text NOT NULL DEFAULT 'all' CHECK (recipient_filter IN ('all', 'global', 'agent')),
  filter_agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "createdBy" uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins staff email campaigns" ON email_campaigns;
CREATE POLICY "Admins staff email campaigns"
  ON email_campaigns FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Unsubscribe without auth
CREATE OR REPLACE FUNCTION public.unsubscribe_email_by_token(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM email_subscribers WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_email_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_email_by_token(uuid) TO anon, authenticated;

-- 5) Property price history (append state on insert + when price/rent changes)
CREATE TABLE IF NOT EXISTS property_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  price numeric,
  rent numeric,
  "changedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property ON property_price_history (property_id, "changedAt" DESC);

ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read price history" ON property_price_history;
CREATE POLICY "Anyone can read price history"
  ON property_price_history FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.log_property_price_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_price_history (property_id, price, rent)
    VALUES (NEW.id, NEW.price, NEW.rent);
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.rent IS DISTINCT FROM NEW.rent) THEN
      INSERT INTO property_price_history (property_id, price, rent)
      VALUES (NEW.id, NEW.price, NEW.rent);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_property_price_history ON properties;
CREATE TRIGGER trg_property_price_history
  AFTER INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_price_state();

INSERT INTO property_price_history (property_id, price, rent)
SELECT p.id, p.price, p.rent
FROM properties p
WHERE NOT EXISTS (
  SELECT 1 FROM property_price_history h WHERE h.property_id = p.id
);

-- 6) Property views
CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  "viewedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views (property_id, "viewedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_session ON property_views (property_id, session_id);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record property view" ON property_views;
CREATE POLICY "Anyone can record property view"
  ON property_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Agents view own listing views" ON property_views;
CREATE POLICY "Agents view own listing views"
  ON property_views FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_views.property_id AND p."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins staff view all property views" ON property_views;
CREATE POLICY "Admins staff view all property views"
  ON property_views FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- 7) Neighborhood guides
CREATE TABLE IF NOT EXISTS neighborhood_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  country text NOT NULL,
  state text,
  title text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}',
  cover_image text,
  published boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_neighborhood_guides_city ON neighborhood_guides (country, city);
CREATE INDEX IF NOT EXISTS idx_neighborhood_guides_published ON neighborhood_guides (published) WHERE published = true;

ALTER TABLE neighborhood_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read published guides" ON neighborhood_guides;
CREATE POLICY "Anyone read published guides"
  ON neighborhood_guides FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admins staff read all guides" ON neighborhood_guides;
CREATE POLICY "Admins staff read all guides"
  ON neighborhood_guides FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "Admins staff manage guides" ON neighborhood_guides;
CREATE POLICY "Admins staff manage guides"
  ON neighborhood_guides FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

DO $$ BEGIN
  CREATE TRIGGER neighborhood_guides_updated_at
    BEFORE UPDATE ON neighborhood_guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN undefined_function THEN
  NULL;
WHEN duplicate_object THEN
  NULL;
END $$;

-- 8) Property owners can see who saved their listings (aggregate analytics)
DROP POLICY IF EXISTS "Owners read saves on own listings" ON "savedProperties";
CREATE POLICY "Owners read saves on own listings"
  ON "savedProperties" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = "savedProperties"."propertyId" AND p."userId" = auth.uid()
    )
  );

-- 9) Agents can read contacts tied to their listings (optional propertyId)
DROP POLICY IF EXISTS "Agents view contacts for own listings" ON contacts;
CREATE POLICY "Agents view contacts for own listings"
  ON contacts FOR SELECT TO authenticated
  USING (
    "propertyId" IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = contacts."propertyId" AND p."userId" = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );
