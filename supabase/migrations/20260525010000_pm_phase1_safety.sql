-- Property management — Phase 1 hardening: safety and correctness
-- This migration is additive on top of 20260525000000_property_management.sql.
--
-- It adds:
--   * Cross-table integrity triggers so that every invoice/payment row matches
--     the lease's tenantId/propertyId/ownerId (no stamping records to the
--     wrong tenant or stealing another agent's property).
--   * A partial unique index on (leaseId, period_start) for kind='rent', so
--     pm_next_rent_invoice() is naturally idempotent.
--   * A scheduled-overdue refresh function that flips sent/partial -> overdue
--     for past-due invoices (called by the Phase 6 worker).
--   * A safer-delete trigger on pm_tenants: hard delete is blocked while
--     tenant is referenced by an active lease; the UI/service archives instead.

-- =========================================================================
-- Cross-table integrity for invoices
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pm_invoice_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  l pm_leases%ROWTYPE;
BEGIN
  SELECT * INTO l FROM pm_leases WHERE id = NEW."leaseId";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice references a lease that does not exist (lease=%)', NEW."leaseId"
      USING ERRCODE = '23503';
  END IF;

  IF NEW."tenantId" <> l."tenantId" THEN
    RAISE EXCEPTION 'invoice.tenantId (%) must match lease.tenantId (%)', NEW."tenantId", l."tenantId"
      USING ERRCODE = '23514';
  END IF;
  IF NEW."propertyId" <> l."propertyId" THEN
    RAISE EXCEPTION 'invoice.propertyId (%) must match lease.propertyId (%)', NEW."propertyId", l."propertyId"
      USING ERRCODE = '23514';
  END IF;

  -- Owner attribution: if the invoice is created by an admin/staff acting on
  -- behalf of an agent, prefer the lease's ownerId rather than the caller.
  IF NEW."ownerId" IS NULL OR NEW."ownerId" <> l."ownerId" THEN
    NEW."ownerId" := l."ownerId";
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_invoice_validate ON pm_invoices;
CREATE TRIGGER trg_pm_invoice_validate
  BEFORE INSERT OR UPDATE OF "leaseId", "tenantId", "propertyId", "ownerId" ON pm_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_invoice_validate();

-- =========================================================================
-- Cross-table integrity for payments
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pm_payment_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  inv pm_invoices%ROWTYPE;
BEGIN
  IF NEW."invoiceId" IS NOT NULL THEN
    SELECT * INTO inv FROM pm_invoices WHERE id = NEW."invoiceId";
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment references an invoice that does not exist'
        USING ERRCODE = '23503';
    END IF;

    -- Coerce/validate downstream attributions to the invoice they apply to.
    IF NEW."leaseId" IS NULL THEN NEW."leaseId" := inv."leaseId"; END IF;
    IF NEW."tenantId" IS NULL THEN NEW."tenantId" := inv."tenantId"; END IF;
    IF NEW."propertyId" IS NULL THEN NEW."propertyId" := inv."propertyId"; END IF;
    IF NEW."ownerId" IS NULL THEN NEW."ownerId" := inv."ownerId"; END IF;

    IF NEW."leaseId" <> inv."leaseId" THEN
      RAISE EXCEPTION 'payment.leaseId must match invoice.leaseId'
        USING ERRCODE = '23514';
    END IF;
    IF NEW."tenantId" <> inv."tenantId" THEN
      RAISE EXCEPTION 'payment.tenantId must match invoice.tenantId'
        USING ERRCODE = '23514';
    END IF;
    IF NEW."propertyId" <> inv."propertyId" THEN
      RAISE EXCEPTION 'payment.propertyId must match invoice.propertyId'
        USING ERRCODE = '23514';
    END IF;
    -- Always attribute to invoice's owner (handles admin/staff acting on behalf).
    NEW."ownerId" := inv."ownerId";
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_payment_validate ON pm_payments;
CREATE TRIGGER trg_pm_payment_validate
  BEFORE INSERT OR UPDATE OF "invoiceId", "leaseId", "tenantId", "propertyId", "ownerId" ON pm_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_payment_validate();

-- =========================================================================
-- Idempotency: one rent invoice per (lease, period_start)
-- =========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pm_invoices_lease_rent_period
  ON pm_invoices ("leaseId", period_start)
  WHERE kind = 'rent' AND period_start IS NOT NULL;

-- =========================================================================
-- Soft delete protection on tenants
-- A tenant referenced by an active lease cannot be hard-deleted; archive instead.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pm_tenant_block_delete_when_active_lease()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pm_leases
    WHERE "tenantId" = OLD.id
      AND status IN ('active', 'pending')
  ) THEN
    RAISE EXCEPTION 'Tenant has active or pending leases; archive instead of deleting'
      USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_tenant_block_delete ON pm_tenants;
CREATE TRIGGER trg_pm_tenant_block_delete
  BEFORE DELETE ON pm_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_tenant_block_delete_when_active_lease();

-- =========================================================================
-- Scheduled overdue refresh
-- Promotes sent/partial -> overdue when due_date < today.
-- Drafts are intentionally never auto-flipped; cancelled is preserved.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pm_refresh_overdue()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected int;
BEGIN
  UPDATE pm_invoices
  SET status = 'overdue', "updatedAt" = now()
  WHERE status IN ('sent', 'partial')
    AND due_date IS NOT NULL
    AND due_date < current_date;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.pm_refresh_overdue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_refresh_overdue() TO authenticated;
