/**
 * Human-friendly booking reference derived from the internal DB id — no
 * extra column needed, it's always unique and assigned at creation time.
 */
export function formatBookingNumber(id: number): string {
  return `CT-${String(id).padStart(6, "0")}`;
}

/**
 * Order reference code for structured-program purchases — support/
 * invoicing tracking code, not a discount/promo code. Derived purely from
 * the order's own id and creation year, same "no extra column" pattern as
 * formatBookingNumber.
 */
export function formatProgramReference(order: { id: number; createdAt: Date }): string {
  const year = order.createdAt.getUTCFullYear();
  return `CT-PROG-${year}-${String(order.id).padStart(4, "0")}`;
}
