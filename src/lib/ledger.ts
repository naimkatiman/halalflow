export const FUNDS = [
  "sewaan", "infaq", "kutipan_jumaat", "khairat", "wakaf", "qurban", "ramadan",
] as const;
export type Fund = (typeof FUNDS)[number];

export const FUND_LABELS: Record<string, string> = {
  sewaan: "Sewaan",
  infaq: "Infaq",
  kutipan_jumaat: "Kutipan Jumaat",
  khairat: "Khairat",
  wakaf: "Wakaf",
  qurban: "Qurban",
  ramadan: "Ramadan",
};

export interface LedgerLike {
  fund: string;
  direction: string;
  amount: number;
  description: string;
  entryDate: Date;
  refType?: string | null;
  refId?: string | null;
}

export function fundTotals(entries: LedgerLike[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const f of FUNDS) totals[f] = 0;
  for (const e of entries) {
    const sign = e.direction === "out" ? -1 : 1;
    totals[e.fund] = (totals[e.fund] ?? 0) + sign * e.amount;
  }
  return totals;
}

function csvCell(value: string): string {
  // Prefix with ' to neutralize spreadsheet formula injection (=, +, -, @, tab).
  const safe = /^[=+\-@\t]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function ledgerCsv(entries: LedgerLike[]): string {
  const header = "date,fund,direction,description,amount_rm,reference";
  const rows = entries.map((e) =>
    [
      e.entryDate.toISOString().slice(0, 10),
      e.fund,
      e.direction,
      csvCell(e.description),
      (e.amount / 100).toFixed(2),
      e.refType && e.refId ? `${e.refType}:${e.refId}` : "",
    ].join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}
