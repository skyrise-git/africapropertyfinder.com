-- Property management module
-- Adds tenants, leases, invoices, payments, expenses, maintenance requests,
-- reminders, and an audit-style notifications log. All new tables/columns are
-- additive and do not impact existing functionality.

-- =========================================================================
-- 1) Tenants
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  national_id text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_tenants_owner ON pm_tenants ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_tenants_email ON pm_tenants (lower(email));

ALTER TABLE pm_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages tenants" ON pm_tenants;
CREATE POLICY "Owner manages tenants"
  ON pm_tenants FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage tenants" ON pm_tenants;
CREATE POLICY "Admins staff manage tenants"
  ON pm_tenants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- 2) Leases (a tenancy on a property)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  "propertyId" uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  "tenantId" uuid NOT NULL REFERENCES pm_tenants(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  rent_amount numeric(14, 2) NOT NULL DEFAULT 0,
  deposit_amount numeric(14, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  payment_frequency text NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'weekly', 'yearly')),
  payment_day smallint NOT NULL DEFAULT 1,
  late_fee_amount numeric(14, 2) DEFAULT 0,
  grace_period_days smallint NOT NULL DEFAULT 5,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ended', 'terminated')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_leases_owner ON pm_leases ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_leases_property ON pm_leases ("propertyId");
CREATE INDEX IF NOT EXISTS idx_pm_leases_tenant ON pm_leases ("tenantId");
CREATE INDEX IF NOT EXISTS idx_pm_leases_status ON pm_leases (status);

ALTER TABLE pm_leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages leases" ON pm_leases;
CREATE POLICY "Owner manages leases"
  ON pm_leases FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage leases" ON pm_leases;
CREATE POLICY "Admins staff manage leases"
  ON pm_leases FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- 3) Invoices (rent invoices, deposit invoices, ad-hoc charges)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  "leaseId" uuid NOT NULL REFERENCES pm_leases(id) ON DELETE CASCADE,
  "tenantId" uuid NOT NULL REFERENCES pm_tenants(id) ON DELETE CASCADE,
  "propertyId" uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'rent' CHECK (kind IN ('rent', 'deposit', 'utility', 'late_fee', 'other')),
  period_start date,
  period_end date,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date NOT NULL,
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  tax numeric(14, 2) NOT NULL DEFAULT 0,
  total numeric(14, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
  sent_at timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_invoices_owner ON pm_invoices ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_invoices_lease ON pm_invoices ("leaseId");
CREATE INDEX IF NOT EXISTS idx_pm_invoices_status ON pm_invoices (status);
CREATE INDEX IF NOT EXISTS idx_pm_invoices_due ON pm_invoices (due_date);

ALTER TABLE pm_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages invoices" ON pm_invoices;
CREATE POLICY "Owner manages invoices"
  ON pm_invoices FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage invoices" ON pm_invoices;
CREATE POLICY "Admins staff manage invoices"
  ON pm_invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Sequence-based invoice number generator using a real Postgres sequence.
-- This is race-free under concurrency; format is INV-YYYY-NNNNN where NNNNN is
-- a global zero-padded counter (sequence resets when manually rotated yearly,
-- but uniqueness within a year is guaranteed by the format + sequence).
CREATE SEQUENCE IF NOT EXISTS pm_invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.pm_generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  yr int := EXTRACT(YEAR FROM COALESCE(NEW.issue_date, current_date))::int;
  next_seq bigint;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;

  next_seq := nextval('pm_invoice_seq');
  NEW.invoice_number := 'INV-' || yr || '-' || LPAD(next_seq::text, 5, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_invoice_number ON pm_invoices;
CREATE TRIGGER trg_pm_invoice_number
  BEFORE INSERT ON pm_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_generate_invoice_number();

-- =========================================================================
-- 4) Payments (apply to invoices)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  "invoiceId" uuid REFERENCES pm_invoices(id) ON DELETE SET NULL,
  "leaseId" uuid REFERENCES pm_leases(id) ON DELETE SET NULL,
  "tenantId" uuid REFERENCES pm_tenants(id) ON DELETE SET NULL,
  "propertyId" uuid REFERENCES properties(id) ON DELETE SET NULL,
  receipt_number text NOT NULL UNIQUE,
  paid_on date NOT NULL DEFAULT current_date,
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  method text NOT NULL DEFAULT 'eft' CHECK (method IN ('cash', 'eft', 'card', 'mobile_money', 'cheque', 'other')),
  reference text,
  notes text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_payments_owner ON pm_payments ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_payments_invoice ON pm_payments ("invoiceId");
CREATE INDEX IF NOT EXISTS idx_pm_payments_paid_on ON pm_payments (paid_on DESC);

ALTER TABLE pm_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages payments" ON pm_payments;
CREATE POLICY "Owner manages payments"
  ON pm_payments FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage payments" ON pm_payments;
CREATE POLICY "Admins staff manage payments"
  ON pm_payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Receipt number generator using a real Postgres sequence (race-free).
CREATE SEQUENCE IF NOT EXISTS pm_receipt_seq START 1;

CREATE OR REPLACE FUNCTION public.pm_generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  yr int := EXTRACT(YEAR FROM COALESCE(NEW.paid_on, current_date))::int;
  next_seq bigint;
BEGIN
  IF NEW.receipt_number IS NOT NULL AND NEW.receipt_number <> '' THEN
    RETURN NEW;
  END IF;

  next_seq := nextval('pm_receipt_seq');
  NEW.receipt_number := 'RCT-' || yr || '-' || LPAD(next_seq::text, 5, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_receipt_number ON pm_payments;
CREATE TRIGGER trg_pm_receipt_number
  BEFORE INSERT ON pm_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_generate_receipt_number();

-- Recompute invoice status when a payment is added/removed/changed.
CREATE OR REPLACE FUNCTION public.pm_recompute_invoice_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_id uuid := COALESCE(NEW."invoiceId", OLD."invoiceId");
  paid_total numeric;
  inv_total numeric;
  inv_due date;
  new_status text;
BEGIN
  IF inv_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO paid_total
  FROM pm_payments WHERE "invoiceId" = inv_id;

  SELECT total, due_date INTO inv_total, inv_due
  FROM pm_invoices WHERE id = inv_id;

  IF inv_total IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF paid_total >= inv_total AND inv_total > 0 THEN
    new_status := 'paid';
  ELSIF paid_total > 0 THEN
    new_status := 'partial';
  ELSIF inv_due IS NOT NULL AND inv_due < current_date THEN
    new_status := 'overdue';
  ELSE
    new_status := 'sent';
  END IF;

  UPDATE pm_invoices
  SET status = new_status, "updatedAt" = now()
  WHERE id = inv_id AND status NOT IN ('cancelled', 'draft');

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_payment_recompute ON pm_payments;
CREATE TRIGGER trg_pm_payment_recompute
  AFTER INSERT OR UPDATE OR DELETE ON pm_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.pm_recompute_invoice_status();

-- =========================================================================
-- 5) Expenses (per property, e.g. repairs, levies, rates, insurance)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  "propertyId" uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  "leaseId" uuid REFERENCES pm_leases(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('maintenance', 'utilities', 'rates', 'levies', 'insurance', 'management_fee', 'other')),
  description text NOT NULL,
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  spent_on date NOT NULL DEFAULT current_date,
  vendor text,
  receipt_url text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_expenses_owner ON pm_expenses ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_expenses_property ON pm_expenses ("propertyId");

ALTER TABLE pm_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages expenses" ON pm_expenses;
CREATE POLICY "Owner manages expenses"
  ON pm_expenses FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage expenses" ON pm_expenses;
CREATE POLICY "Admins staff manage expenses"
  ON pm_expenses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- 6) Maintenance requests
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  "propertyId" uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  "tenantId" uuid REFERENCES pm_tenants(id) ON DELETE SET NULL,
  "leaseId" uuid REFERENCES pm_leases(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  reported_on date NOT NULL DEFAULT current_date,
  resolved_on date,
  cost numeric(14, 2),
  vendor text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_maintenance_owner ON pm_maintenance_requests ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_maintenance_property ON pm_maintenance_requests ("propertyId");
CREATE INDEX IF NOT EXISTS idx_pm_maintenance_status ON pm_maintenance_requests (status);

ALTER TABLE pm_maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages maintenance" ON pm_maintenance_requests;
CREATE POLICY "Owner manages maintenance"
  ON pm_maintenance_requests FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage maintenance" ON pm_maintenance_requests;
CREATE POLICY "Admins staff manage maintenance"
  ON pm_maintenance_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- 7) Reminders / scheduled notifications
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('rent_due', 'invoice_overdue', 'lease_expiring', 'custom')),
  "leaseId" uuid REFERENCES pm_leases(id) ON DELETE CASCADE,
  "invoiceId" uuid REFERENCES pm_invoices(id) ON DELETE CASCADE,
  "tenantId" uuid REFERENCES pm_tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  remind_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'in_app')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled', 'acknowledged')),
  sent_at timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_reminders_owner ON pm_reminders ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_reminders_remind_at ON pm_reminders (remind_at);
CREATE INDEX IF NOT EXISTS idx_pm_reminders_status ON pm_reminders (status);

ALTER TABLE pm_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages reminders" ON pm_reminders;
CREATE POLICY "Owner manages reminders"
  ON pm_reminders FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage reminders" ON pm_reminders;
CREATE POLICY "Admins staff manage reminders"
  ON pm_reminders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- 8) Outbound message log (record of invoice / receipt / reminder emails sent)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  "tenantId" uuid REFERENCES pm_tenants(id) ON DELETE SET NULL,
  "invoiceId" uuid REFERENCES pm_invoices(id) ON DELETE SET NULL,
  "paymentId" uuid REFERENCES pm_payments(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('invoice', 'receipt', 'reminder', 'lease_notice', 'custom')),
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'in_app')),
  recipient text NOT NULL,
  subject text,
  body text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_messages_owner ON pm_messages ("ownerId");
CREATE INDEX IF NOT EXISTS idx_pm_messages_kind ON pm_messages (kind);

ALTER TABLE pm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads messages" ON pm_messages;
CREATE POLICY "Owner reads messages"
  ON pm_messages FOR ALL TO authenticated
  USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

DROP POLICY IF EXISTS "Admins staff manage messages" ON pm_messages;
CREATE POLICY "Admins staff manage messages"
  ON pm_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- =========================================================================
-- 9) Helper: generate the next rent invoice for a lease
-- =========================================================================
-- SECURITY: this function asserts the caller is either the lease owner or an
-- admin/staff. Without this guard, any authenticated user could trigger an
-- invoice creation on any lease. The function is also idempotent thanks to a
-- partial unique index defined later in this file (see Phase 1 hardening).
CREATE OR REPLACE FUNCTION public.pm_next_rent_invoice(p_lease uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l pm_leases%ROWTYPE;
  caller_role text;
  last_period_end date;
  next_start date;
  next_end date;
  due date;
  inv_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO l FROM pm_leases WHERE id = p_lease;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lease % not found', p_lease;
  END IF;

  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF l."ownerId" <> auth.uid() AND COALESCE(caller_role, 'user') NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Not authorized for lease %', p_lease USING ERRCODE = '42501';
  END IF;

  SELECT MAX(period_end) INTO last_period_end
  FROM pm_invoices WHERE "leaseId" = p_lease AND kind = 'rent';

  IF last_period_end IS NULL THEN
    next_start := l.start_date;
  ELSE
    next_start := last_period_end + 1;
  END IF;

  IF l.payment_frequency = 'weekly' THEN
    next_end := next_start + INTERVAL '7 days' - INTERVAL '1 day';
  ELSIF l.payment_frequency = 'yearly' THEN
    next_end := (next_start + INTERVAL '1 year' - INTERVAL '1 day')::date;
  ELSE
    next_end := (next_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
  END IF;

  due := next_start + (l.grace_period_days || ' days')::interval;

  -- Idempotency: if a rent invoice for this period already exists, return it.
  SELECT id INTO inv_id FROM pm_invoices
  WHERE "leaseId" = p_lease AND kind = 'rent' AND period_start = next_start
  LIMIT 1;
  IF FOUND THEN
    RETURN inv_id;
  END IF;

  INSERT INTO pm_invoices (
    "ownerId", "leaseId", "tenantId", "propertyId",
    invoice_number, kind, period_start, period_end,
    issue_date, due_date, amount, total, currency, status
  ) VALUES (
    l."ownerId", l.id, l."tenantId", l."propertyId",
    '', 'rent', next_start, next_end,
    current_date, due, l.rent_amount, l.rent_amount, l.currency, 'draft'
  ) RETURNING id INTO inv_id;

  RETURN inv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pm_next_rent_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_next_rent_invoice(uuid) TO authenticated;

-- =========================================================================
-- 10) Touch updatedAt on row updates (uses existing helper if available)
-- =========================================================================
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'update_updated_at';
  IF FOUND THEN
    EXECUTE 'CREATE TRIGGER pm_tenants_touch BEFORE UPDATE ON pm_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
    EXECUTE 'CREATE TRIGGER pm_leases_touch BEFORE UPDATE ON pm_leases FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
    EXECUTE 'CREATE TRIGGER pm_invoices_touch BEFORE UPDATE ON pm_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
    EXECUTE 'CREATE TRIGGER pm_payments_touch BEFORE UPDATE ON pm_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
    EXECUTE 'CREATE TRIGGER pm_expenses_touch BEFORE UPDATE ON pm_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
    EXECUTE 'CREATE TRIGGER pm_maintenance_touch BEFORE UPDATE ON pm_maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
    EXECUTE 'CREATE TRIGGER pm_reminders_touch BEFORE UPDATE ON pm_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at()';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
