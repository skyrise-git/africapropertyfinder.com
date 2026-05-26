-- Property management — Phases 8 + 9: PayPal collection + platform fee engine
-- Stores payment intents, raw webhook events, manual payout instructions, an
-- internal ledger for accounting truth, and the fee policy snapshot on each
-- lease/invoice for an immutable history.

-- =========================================================================
-- Phase 9 part A: lease-level fee policy
-- =========================================================================
ALTER TABLE pm_leases
  ADD COLUMN IF NOT EXISTS fee_bearer text NOT NULL DEFAULT 'owner'
    CHECK (fee_bearer IN ('owner', 'tenant')),
  ADD COLUMN IF NOT EXISTS fee_basis_points int NOT NULL DEFAULT 50
    CHECK (fee_basis_points >= 0 AND fee_basis_points <= 1000);

-- =========================================================================
-- Phase 9 part B: per-invoice fee snapshot (immutable once issued)
-- =========================================================================
ALTER TABLE pm_invoices
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_bearer text NOT NULL DEFAULT 'owner'
    CHECK (platform_fee_bearer IN ('owner', 'tenant')),
  ADD COLUMN IF NOT EXISTS platform_fee_basis_points int NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS owner_net_amount numeric(14, 2) NOT NULL DEFAULT 0;

-- Snapshot lease fee policy onto invoice when row is inserted; recompute
-- amounts so the breakdown is consistent.
CREATE OR REPLACE FUNCTION public.pm_invoice_apply_fee_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  l pm_leases%ROWTYPE;
  base_amount numeric(14, 2);
  fee numeric(14, 2);
BEGIN
  SELECT * INTO l FROM pm_leases WHERE id = NEW."leaseId";
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Snapshot policy at issue time (do not pull from lease later).
  IF TG_OP = 'INSERT' THEN
    NEW.platform_fee_basis_points := l.fee_basis_points;
    NEW.platform_fee_bearer := l.fee_bearer;
  END IF;

  -- Fee applies to the rent line only by convention (deposits and late fees
  -- bypass platform fee unless the operator chooses otherwise via direct
  -- update). Computed deterministically with ROUND_HALF_UP via numeric.
  base_amount := COALESCE(NEW.amount, 0);
  IF NEW.kind = 'rent' THEN
    fee := round(base_amount * NEW.platform_fee_basis_points::numeric / 10000.0, 2);
  ELSE
    fee := 0;
  END IF;
  NEW.platform_fee_amount := fee;

  IF NEW.platform_fee_bearer = 'tenant' THEN
    -- Tenant total = rent + fee; owner net = rent.
    NEW.total := COALESCE(base_amount, 0) + COALESCE(NEW.tax, 0) + fee;
    NEW.owner_net_amount := base_amount;
  ELSE
    -- Owner absorbs fee; tenant total = rent (+tax). Owner net = rent - fee.
    NEW.total := COALESCE(base_amount, 0) + COALESCE(NEW.tax, 0);
    NEW.owner_net_amount := GREATEST(base_amount - fee, 0);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_invoice_fee_snapshot ON pm_invoices;
CREATE TRIGGER trg_pm_invoice_fee_snapshot
  BEFORE INSERT OR UPDATE OF amount, tax, kind, "leaseId" ON pm_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_invoice_apply_fee_snapshot();

-- =========================================================================
-- Phase 8 part A: payment intents (one per checkout attempt)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "invoiceId" uuid NOT NULL REFERENCES pm_invoices(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'paypal' CHECK (provider IN ('paypal')),
  provider_order_id text UNIQUE,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  platform_fee_amount numeric(14, 2) NOT NULL DEFAULT 0,
  platform_fee_bearer text NOT NULL DEFAULT 'owner',
  status text NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'approved', 'captured', 'failed', 'voided', 'refunded')
  ),
  capture_id text,
  raw_capture jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_payment_intents_invoice ON pm_payment_intents ("invoiceId");
CREATE INDEX IF NOT EXISTS idx_pm_payment_intents_status ON pm_payment_intents (status);

ALTER TABLE pm_payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads payment intents" ON pm_payment_intents;
CREATE POLICY "Owner reads payment intents"
  ON pm_payment_intents FOR SELECT TO authenticated
  USING ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Tenant reads own payment intents" ON pm_payment_intents;
CREATE POLICY "Tenant reads own payment intents"
  ON pm_payment_intents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM pm_invoices i
      JOIN pm_tenants t ON t.id = i."tenantId"
      WHERE i.id = pm_payment_intents."invoiceId"
        AND t.linked_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins staff manage payment intents" ON pm_payment_intents;
CREATE POLICY "Admins staff manage payment intents"
  ON pm_payment_intents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- Phase 8 part B: raw webhook events (audit log)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'paypal',
  provider_event_id text UNIQUE,
  event_type text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_payment_events_processed ON pm_payment_events (processed);

ALTER TABLE pm_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read payment events" ON pm_payment_events;
CREATE POLICY "Admins read payment events"
  ON pm_payment_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- Phase 8 part C: payouts (manual)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  period_start date,
  period_end date,
  gross_amount numeric(14, 2) NOT NULL DEFAULT 0,
  platform_fee_amount numeric(14, 2) NOT NULL DEFAULT 0,
  processor_fee_amount numeric(14, 2) NOT NULL DEFAULT 0,
  net_amount numeric(14, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'approved', 'sent', 'reconciled', 'failed', 'cancelled')
  ),
  method text,
  reference text,
  notes text,
  approved_at timestamptz,
  sent_at timestamptz,
  reconciled_at timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_payouts_owner ON pm_payouts ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_payouts_status ON pm_payouts (status);

ALTER TABLE pm_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own payouts" ON pm_payouts;
CREATE POLICY "Owner reads own payouts"
  ON pm_payouts FOR SELECT TO authenticated
  USING ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage payouts" ON pm_payouts;
CREATE POLICY "Admins staff manage payouts"
  ON pm_payouts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- Phase 8 part D: ledger entries (immutable double-entry style)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "invoiceId" uuid REFERENCES pm_invoices(id) ON DELETE SET NULL,
  "paymentId" uuid REFERENCES pm_payments(id) ON DELETE SET NULL,
  "intentId" uuid REFERENCES pm_payment_intents(id) ON DELETE SET NULL,
  "payoutId" uuid REFERENCES pm_payouts(id) ON DELETE SET NULL,
  account text NOT NULL CHECK (account IN (
    'collection',
    'fee_revenue',
    'processor_expense',
    'payable_to_owner',
    'payout',
    'refund'
  )),
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  memo text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_ledger_owner ON pm_ledger_entries ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_ledger_account ON pm_ledger_entries (account);

ALTER TABLE pm_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own ledger" ON pm_ledger_entries;
CREATE POLICY "Owner reads own ledger"
  ON pm_ledger_entries FOR SELECT TO authenticated
  USING ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins read all ledger" ON pm_ledger_entries;
CREATE POLICY "Admins read all ledger"
  ON pm_ledger_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- Owner balance view: payable_to_owner - payout = outstanding liability
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_owner_balances AS
SELECT
  "ownerId" AS owner_id,
  SUM(CASE WHEN account = 'payable_to_owner' THEN amount ELSE 0 END)
   - SUM(CASE WHEN account = 'payout' THEN amount ELSE 0 END) AS outstanding_to_owner,
  SUM(CASE WHEN account = 'fee_revenue' THEN amount ELSE 0 END) AS lifetime_fee_revenue,
  SUM(CASE WHEN account = 'collection' THEN amount ELSE 0 END) AS lifetime_collected
FROM pm_ledger_entries
GROUP BY 1;
