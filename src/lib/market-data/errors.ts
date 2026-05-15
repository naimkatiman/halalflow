export class MarketDataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "MarketDataError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class HubUnavailableError extends MarketDataError {
  readonly status?: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "HubUnavailableError";
    this.status = options?.status;
  }
}

export class SymbolNotFoundError extends MarketDataError {
  readonly symbol: string;

  constructor(symbol: string, message?: string) {
    super(message ?? `Symbol not found: ${symbol}`);
    this.name = "SymbolNotFoundError";
    this.symbol = symbol;
  }
}
