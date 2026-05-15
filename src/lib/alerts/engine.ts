import type { AlertRule } from "@prisma/client";
import { getQuote } from "../market-data/hub-client";
import {
  HubUnavailableError,
  SymbolNotFoundError,
} from "../market-data/errors";

export type AlertCondition = "above" | "below";

export interface TriggeredAlert {
  rule: AlertRule;
  price: number;
  timestamp: string;
}

export interface EvaluationError {
  ruleId: string;
  symbol: string;
  reason: "symbol_not_found" | "hub_unavailable" | "unknown";
  message: string;
}

export interface EvaluationResult {
  triggered: TriggeredAlert[];
  errors: EvaluationError[];
}

export function isConditionMet(
  condition: string,
  price: number,
  threshold: number
): boolean {
  if (condition === "above") return price > threshold;
  if (condition === "below") return price < threshold;
  return false;
}

export async function evaluateRules(
  rules: ReadonlyArray<AlertRule>
): Promise<EvaluationResult> {
  const activeRules = rules.filter((r) => r.active);
  const symbols = Array.from(
    new Set(activeRules.map((r) => r.symbol.toUpperCase()))
  );

  const quoteEntries = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await getQuote(symbol);
        return { symbol, quote, error: null as EvaluationError | null };
      } catch (err: unknown) {
        let error: EvaluationError;
        if (err instanceof SymbolNotFoundError) {
          error = {
            ruleId: "",
            symbol,
            reason: "symbol_not_found",
            message: err.message,
          };
        } else if (err instanceof HubUnavailableError) {
          error = {
            ruleId: "",
            symbol,
            reason: "hub_unavailable",
            message: err.message,
          };
        } else {
          error = {
            ruleId: "",
            symbol,
            reason: "unknown",
            message: err instanceof Error ? err.message : String(err),
          };
        }
        return { symbol, quote: null, error };
      }
    })
  );

  const quoteBySymbol = new Map<
    string,
    { price: number; timestamp: string }
  >();
  const errorBySymbol = new Map<string, EvaluationError>();
  for (const entry of quoteEntries) {
    if (entry.quote) {
      quoteBySymbol.set(entry.symbol, {
        price: entry.quote.price,
        timestamp: entry.quote.timestamp,
      });
    } else if (entry.error) {
      errorBySymbol.set(entry.symbol, entry.error);
    }
  }

  const triggered: TriggeredAlert[] = [];
  const errors: EvaluationError[] = [];

  for (const rule of activeRules) {
    const sym = rule.symbol.toUpperCase();
    const quote = quoteBySymbol.get(sym);
    if (!quote) {
      const baseErr = errorBySymbol.get(sym);
      if (baseErr) {
        errors.push({ ...baseErr, ruleId: rule.id });
      }
      continue;
    }
    if (isConditionMet(rule.condition, quote.price, rule.threshold)) {
      triggered.push({
        rule,
        price: quote.price,
        timestamp: quote.timestamp,
      });
    }
  }

  return { triggered, errors };
}
