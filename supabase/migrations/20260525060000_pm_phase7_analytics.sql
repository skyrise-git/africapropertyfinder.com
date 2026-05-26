-- Property management — Phase 7: analytics views
-- These are SECURITY INVOKER views so they inherit RLS from the underlying
-- pm_* tables. Owners see only their own portfolio; admin/staff see all.

-- =========================================================================
-- Owner cashflow by month
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_owner_cashflow_monthly AS
SELECT
  COALESCE(p."ownerId", i."ownerId") AS owner_id,
  to_char(date_trunc('month', COALESCE(p.paid_on, i.issue_date))::date, 'YYYY-MM') AS month,
  SUM(CASE WHEN p.id IS NOT NULL THEN p.amount ELSE 0 END)::numeric AS collected,
  SUM(CASE WHEN i.id IS NOT NULL AND i.status NOT IN ('paid', 'cancelled')
           THEN i.total ELSE 0 END)::numeric AS outstanding
FROM pm_invoices i
FULL OUTER JOIN pm_payments p ON p."invoiceId" = i.id
GROUP BY 1, 2;

-- =========================================================================
-- Owner outstanding aging buckets (by oldest unpaid balance day)
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_owner_aging AS
SELECT
  i."ownerId" AS owner_id,
  CASE
    WHEN current_date - i.due_date <= 0 THEN 'current'
    WHEN current_date - i.due_date <= 30 THEN '1-30'
    WHEN current_date - i.due_date <= 60 THEN '31-60'
    WHEN current_date - i.due_date <= 90 THEN '61-90'
    ELSE '90+'
  END AS bucket,
  SUM(
    GREATEST(
      0,
      i.total
      - COALESCE((SELECT SUM(amount) FROM pm_payments WHERE "invoiceId" = i.id), 0)
    )
  )::numeric AS amount,
  COUNT(*) AS invoice_count
FROM pm_invoices i
WHERE i.status IN ('sent', 'partial', 'overdue')
GROUP BY 1, 2;

-- =========================================================================
-- Owner occupancy
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_owner_occupancy AS
SELECT
  pr.management_owner_id AS owner_id,
  COUNT(*) FILTER (WHERE pr.is_under_management) AS managed_total,
  COUNT(DISTINCT l."propertyId") FILTER (WHERE l.status = 'active') AS occupied,
  COUNT(*) FILTER (WHERE pr.is_under_management) -
    COUNT(DISTINCT l."propertyId") FILTER (WHERE l.status = 'active') AS vacant,
  COUNT(*) FILTER (
    WHERE l.status = 'active'
      AND l.end_date IS NOT NULL
      AND l.end_date <= current_date + INTERVAL '90 days'
  ) AS expiring_90d
FROM properties pr
LEFT JOIN pm_leases l ON l."propertyId" = pr.id
WHERE pr.is_under_management = true
GROUP BY 1;

-- =========================================================================
-- Agent upsell funnel: rent listings -> managed -> active leases
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_agent_funnel AS
SELECT
  pr."userId" AS agent_id,
  COUNT(*) FILTER (WHERE pr."listingType" = 'rent') AS rent_listings,
  COUNT(*) FILTER (
    WHERE pr."listingType" = 'rent' AND pr.is_under_management
  ) AS rent_under_management,
  COUNT(DISTINCT l."propertyId") FILTER (WHERE l.status = 'active') AS active_lease_properties
FROM properties pr
LEFT JOIN pm_leases l ON l."propertyId" = pr.id
GROUP BY 1;

-- =========================================================================
-- Tenant SLA: avg days to resolve a maintenance request, per owner
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_owner_maintenance_sla AS
SELECT
  "ownerId" AS owner_id,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
  AVG(
    EXTRACT(EPOCH FROM (resolved_on::timestamp - reported_on::timestamp)) / 86400.0
  ) FILTER (WHERE status = 'resolved' AND resolved_on IS NOT NULL) AS avg_days_to_resolve,
  COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) AS open_count
FROM pm_maintenance_requests
GROUP BY 1;

-- =========================================================================
-- Admin: portfolio rollups by city
-- =========================================================================
CREATE OR REPLACE VIEW pm_v_admin_city_rollup AS
SELECT
  pr.city,
  COUNT(*) FILTER (WHERE pr.is_under_management) AS managed,
  COUNT(*) FILTER (WHERE pr.is_under_management AND l.status = 'active') AS occupied,
  SUM(
    CASE WHEN l.status = 'active'
         THEN l.rent_amount
         ELSE 0 END
  )::numeric AS active_rent_value
FROM properties pr
LEFT JOIN pm_leases l ON l."propertyId" = pr.id
GROUP BY 1
ORDER BY managed DESC NULLS LAST;
