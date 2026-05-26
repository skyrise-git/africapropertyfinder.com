-- Property management — Phase 4: tenant account model
-- Tenants can be invited to claim a real account that scopes them to their
-- own lease, invoices, payments, maintenance requests, and reminders.

ALTER TABLE pm_tenants
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_token uuid,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_accepted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pm_tenants_linked_user
  ON pm_tenants (linked_user_id)
  WHERE linked_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pm_tenants_invite_token
  ON pm_tenants (invite_token)
  WHERE invite_token IS NOT NULL;

-- Tenant portal: linked tenant can read their own pm_tenants row.
DROP POLICY IF EXISTS "Tenant reads own tenant row" ON pm_tenants;
CREATE POLICY "Tenant reads own tenant row"
  ON pm_tenants FOR SELECT TO authenticated
  USING (linked_user_id = auth.uid());

-- Tenant portal: read leases that belong to me.
DROP POLICY IF EXISTS "Tenant reads own lease" ON pm_leases;
CREATE POLICY "Tenant reads own lease"
  ON pm_leases FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pm_tenants
      WHERE pm_tenants.id = pm_leases."tenantId"
        AND pm_tenants.linked_user_id = auth.uid()
    )
  );

-- Tenant portal: read invoices for me.
DROP POLICY IF EXISTS "Tenant reads own invoices" ON pm_invoices;
CREATE POLICY "Tenant reads own invoices"
  ON pm_invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pm_tenants
      WHERE pm_tenants.id = pm_invoices."tenantId"
        AND pm_tenants.linked_user_id = auth.uid()
    )
  );

-- Tenant portal: read payments for me.
DROP POLICY IF EXISTS "Tenant reads own payments" ON pm_payments;
CREATE POLICY "Tenant reads own payments"
  ON pm_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pm_tenants
      WHERE pm_tenants.id = pm_payments."tenantId"
        AND pm_tenants.linked_user_id = auth.uid()
    )
  );

-- Tenant portal: read maintenance for me.
DROP POLICY IF EXISTS "Tenant reads own maintenance" ON pm_maintenance_requests;
CREATE POLICY "Tenant reads own maintenance"
  ON pm_maintenance_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pm_tenants
      WHERE pm_tenants.id = pm_maintenance_requests."tenantId"
        AND pm_tenants.linked_user_id = auth.uid()
    )
  );

-- Tenant portal: tenants can submit a maintenance request for their own lease.
DROP POLICY IF EXISTS "Tenant submits own maintenance" ON pm_maintenance_requests;
CREATE POLICY "Tenant submits own maintenance"
  ON pm_maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pm_tenants
      WHERE pm_tenants.id = pm_maintenance_requests."tenantId"
        AND pm_tenants.linked_user_id = auth.uid()
    )
  );

-- =========================================================================
-- Issue an invite token: callable by lease/tenant owner or admin/staff.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pm_issue_tenant_invite(p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t pm_tenants%ROWTYPE;
  caller_role text;
  token uuid := gen_random_uuid();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT * INTO t FROM pm_tenants WHERE id = p_tenant;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant % not found', p_tenant;
  END IF;
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF t."ownerId" <> auth.uid() AND COALESCE(caller_role, 'user') NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Not authorized to invite tenant %', p_tenant USING ERRCODE = '42501';
  END IF;

  UPDATE pm_tenants
  SET invite_token = token,
      invite_sent_at = now(),
      "updatedAt" = now()
  WHERE id = p_tenant;
  RETURN token;
END;
$$;

REVOKE ALL ON FUNCTION public.pm_issue_tenant_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_issue_tenant_invite(uuid) TO authenticated;

-- =========================================================================
-- Accept an invite token: links the calling user to the tenant row and
-- grants the canLeaseAsTenant capability.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pm_accept_tenant_invite(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t pm_tenants%ROWTYPE;
  acting uuid := auth.uid();
BEGIN
  IF acting IS NULL THEN
    RAISE EXCEPTION 'Authentication required to accept invite';
  END IF;

  SELECT * INTO t FROM pm_tenants WHERE invite_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token' USING ERRCODE = '42704';
  END IF;
  IF t.linked_user_id IS NOT NULL AND t.linked_user_id <> acting THEN
    RAISE EXCEPTION 'This tenant record is already linked to another account'
      USING ERRCODE = '23505';
  END IF;

  UPDATE pm_tenants
  SET linked_user_id = acting,
      invite_accepted_at = now(),
      invite_token = NULL,
      "updatedAt" = now()
  WHERE id = t.id;

  -- Flip the canLeaseAsTenant capability for the linked user.
  UPDATE profiles
  SET capabilities = COALESCE(capabilities, '{}'::jsonb)
                   || jsonb_build_object('canLeaseAsTenant', true),
      "updatedAt" = now()
  WHERE id = acting;

  RETURN t.id;
END;
$$;

REVOKE ALL ON FUNCTION public.pm_accept_tenant_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_accept_tenant_invite(uuid) TO authenticated;
