/**
 * Formats a numeric amount as a currency string. Falls back to an em dash for
 * empty/invalid values so tables render cleanly.
 */
export function formatMoney(
  n: number | undefined | null,
  currency = "ZAR",
  locale = "en-ZA",
): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}
