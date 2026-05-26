-- Property management — Phase 2: account capability flags
-- Adds a typed JSONB capabilities object on profiles. One account can hold any
-- combination of capabilities (canList, canBuy, canManageProperty,
-- canLeaseAsTenant). Existing role-based area routing is preserved; new
-- features gate on capabilities for a smoother multi-persona experience.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS capabilities jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Seed capabilities from existing role.
UPDATE profiles
SET capabilities = capabilities || jsonb_build_object(
  'canList',
    role IN ('admin', 'staff', 'agent'),
  'canBuy',
    true,
  'canManageProperty',
    role IN ('admin', 'staff', 'agent'),
  'canLeaseAsTenant',
    COALESCE((capabilities ->> 'canLeaseAsTenant')::boolean, false)
)
WHERE capabilities IS NULL OR capabilities = '{}'::jsonb OR NOT (capabilities ? 'canList');

-- Auto-seed capabilities on new profile inserts (extends existing trigger).
CREATE OR REPLACE FUNCTION public.pm_default_capabilities()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.capabilities IS NULL OR NEW.capabilities = '{}'::jsonb THEN
    NEW.capabilities := jsonb_build_object(
      'canList', NEW.role IN ('admin', 'staff', 'agent'),
      'canBuy', true,
      'canManageProperty', NEW.role IN ('admin', 'staff', 'agent'),
      'canLeaseAsTenant', false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_default_capabilities ON profiles;
CREATE TRIGGER trg_pm_default_capabilities
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_default_capabilities();

-- Self-update of capabilities is allowed via existing "Users can update own
-- profile" policy. Admins/staff can update any profile via existing policies
-- in admin_portal_rls migration; capabilities ride along with that.
