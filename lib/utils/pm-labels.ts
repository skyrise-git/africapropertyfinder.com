import type { Property } from "@/lib/types/property.type";
import type { Lease, Tenant } from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";

/**
 * Human-friendly label for a lease selector.
 * Examples:
 *   "12 Acacia Lane — Jane Doe (R8 500/month)"
 *   "Lease 1d4b… — Jane Doe (R8 500/month)" when property is missing
 *   "Lease 1d4b…" as the absolute fallback
 */
export function leaseLabel(
  lease: Lease,
  ctx: {
    property?: Property | null;
    tenant?: Tenant | null;
  } = {},
): string {
  const propertyTitle = ctx.property?.title?.trim();
  const tenantName = ctx.tenant?.name?.trim();
  const rent = formatMoney(Number(lease.rent_amount), lease.currency);
  const freq =
    lease.payment_frequency === "monthly"
      ? "month"
      : lease.payment_frequency === "weekly"
        ? "week"
        : "year";

  const head =
    propertyTitle || (lease.id ? `Lease ${lease.id.slice(0, 4)}…` : "Lease");
  const middle = tenantName ? ` — ${tenantName}` : "";
  return `${head}${middle} (${rent}/${freq})`;
}

/** Lookup helper used inside list pages where we already have arrays. */
export function leaseLabelFromMaps(
  lease: Lease,
  propertyMap: Record<string, Property | undefined>,
  tenantMap: Record<string, Tenant | undefined>,
): string {
  return leaseLabel(lease, {
    property: propertyMap[lease.propertyId],
    tenant: tenantMap[lease.tenantId],
  });
}
