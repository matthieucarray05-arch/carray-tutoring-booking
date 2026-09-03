/**
 * Human-friendly booking reference derived from the internal DB id — no
 * extra column needed, it's always unique and assigned at creation time.
 */
export function formatBookingNumber(id: number): string {
  return `CT-${String(id).padStart(6, "0")}`;
}
