-- Add 'agent' as a fourth role and create agent_profiles table
-- Agents are external real estate professionals; they can manage their OWN listings,
-- leads, and appointments but CANNOT write to crime_stations or price_estimates.

-- 1. Expand the role CHECK constraint on profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'staff', 'agent', 'user'));

-- 2. Agent profiles — extended info for agents
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brokerage_name text,
  license_number text,
  service_areas jsonb DEFAULT '[]'::jsonb,
  specializations text[] DEFAULT '{}',
  bio text,
  profile_photo text,
  website text,
  phone_display text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_profiles_user_unique UNIQUE (user_id)
);

ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent profiles"
  ON agent_profiles FOR SELECT USING (true);

CREATE POLICY "Agents can manage own profile"
  ON agent_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage any agent profile"
  ON agent_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Ensure agents can create properties (free posting)
-- The existing INSERT policy is WITH CHECK (true) for authenticated users,
-- which already covers agents. No change needed.

-- 4. Agents can SELECT appointments linked to their own listings
DO $$ BEGIN
  CREATE POLICY "Agents can view own listing appointments"
    ON appointments FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM properties
        WHERE properties.id = appointments."propertyId"
          AND properties."userId" = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Agents can update their own listing appointments (status, notes)
DO $$ BEGIN
  CREATE POLICY "Agents can update own listing appointments"
    ON appointments FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM properties
        WHERE properties.id = appointments."propertyId"
          AND properties."userId" = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Trigger to auto-create agent_profiles row when a profile with role='agent' is inserted
CREATE OR REPLACE FUNCTION create_agent_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'agent' THEN
    INSERT INTO agent_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_agent_profile ON profiles;
CREATE TRIGGER trg_create_agent_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_agent_profile_on_signup();

-- NOTE: crime_stations and price_estimates INSERT/UPDATE/DELETE policies
-- remain restricted to admin + staff only. No changes needed there.
-- Agents inherit the public SELECT policies for read-only access.
