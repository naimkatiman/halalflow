import { describe, expect, it } from "vitest";
import { FUNDS, fundTotals, ledgerCsv } from "./ledger";

const entries = [
  { fund: "sewaan", direction: "in", amount: 150000, description: "Sewaan dewan", entryDate: new Date("2026-06-01"), refType: "booking", refId: "abc123def" },
  { fund: "sewaan", direction: "out", amount: 20000, description: "Cuci dewan", entryDate: new Date("2026-06-02"), refType: null, refId: null },
  { fund: "infaq", direction: "in", amount: 50000, description: "Tabung infaq", entryDate: new Date("2026-06-03"), refType: null, refId: null },
];

describe("fundTotals", () => {
  it("nets in minus out per fund", () => {
    const totals = fundTotals(entries);
    expect(totals.sewaan).toBe(130000);
    expect(totals.infaq).toBe(50000);
  });
  it("returns zero for funds with no entries", () => {
    const totals = fundTotals([]);
    for (const f of FUNDS) expect(totals[f]).toBe(0);
  });
});

describe("ledgerCsv", () => {
  it("emits header plus one row per entry with RM decimals", () => {
    const csv = ledgerCsv(entries);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("date,fund,direction,description,amount_rm,reference");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain("1500.00");
    expect(lines[1]).toContain("booking:abc123def");
  });
  it("escapes commas and quotes in descriptions", () => {
    const csv = ledgerCsv([{ ...entries[0], description: 'Sewa "dewan", deposit' }]);
    expect(csv).toContain('"Sewa ""dewan"", deposit"');
  });
  it("quotes fields containing carriage returns", () => {
    const csv = ledgerCsv([{ ...entries[0], description: "Sewa\rdewan" }]);
    expect(csv).toContain('"Sewa\rdewan"');
  });
  it("neutralizes Excel formula injection in descriptions", () => {
    const csv = ledgerCsv([{ ...entries[0], description: "=HYPERLINK(\"http://evil\")" }]);
    expect(csv).toContain("'=HYPERLINK");
  });
});
