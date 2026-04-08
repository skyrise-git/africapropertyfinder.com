-- Saved searches for personalized feed
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Search',
  filters jsonb NOT NULL DEFAULT '{}',
  "notifyEmail" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches ("userId");

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE TO authenticated
  USING (auth.uid() = "userId");

DO $$ BEGIN
  CREATE TRIGGER saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
