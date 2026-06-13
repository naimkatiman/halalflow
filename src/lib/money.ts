const myr = new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" });

/** Render integer sen as RM string, e.g. 150000 -> "RM1,500.00" */
export function formatMYR(sen: number): string {
  return myr.format(sen / 100);
}

/** Parse an "RM decimal" form input (e.g. "1500" or "1500.50") into integer sen. */
export function parseRmToSen(input: string): number | null {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
