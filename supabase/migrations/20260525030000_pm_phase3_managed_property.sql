-- Property management — Phase 3: managed property lifecycle
-- Treats "managed property" as a lifecycle state on the existing properties
-- table rather than a parallel managed_properties table. This keeps the
-- listing UX coherent and avoids data duplication.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_under_management boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS management_owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS managed_since timestamptz,
  ADD COLUMN IF NOT EXISTS management_terms jsonb;

CREATE INDEX IF NOT EXISTS idx_properties_managed
  ON properties (is_under_management)
  WHERE is_under_management = true;

CREATE INDEX IF NOT EXISTS idx_properties_management_owner
  ON properties (management_owner_id)
  WHERE management_owner_id IS NOT NULL;

-- Helper: enable management on a property (callable by owner or admin/staff)
CREATE OR REPLACE FUNCTION public.pm_enable_management(p_property uuid, p_terms jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop properties%ROWTYPE;
  caller_role text;
  acting uuid := auth.uid();
BEGIN
  IF acting IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO prop FROM properties WHERE id = p_property;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property % not found', p_property;
  END IF;

  SELECT role INTO caller_role FROM profiles WHERE id = acting;
  IF prop."userId" <> acting AND COALESCE(caller_role, 'user') NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Not authorized to enable management for property %', p_property
      USING ERRCODE = '42501';
  END IF;

  UPDATE properties
  SET is_under_management = true,
      management_owner_id  = COALESCE(prop."userId", acting),
      managed_since        = COALESCE(managed_since, now()),
      management_terms     = COALESCE(p_terms, management_terms),
      "updatedAt"          = now()
  WHERE id = p_property;
END;
$$;

REVOKE ALL ON FUNCTION public.pm_enable_management(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_enable_management(uuid, jsonb) TO authenticated;
