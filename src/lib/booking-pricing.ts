export interface RateLike {
  rateKariah: number;
  rateAwam: number;
  deposit: number;
}

export interface Estimate {
  rate: number;
  deposit: number;
  total: number;
}

/** Estimated rate (sen) for an applicant: kariah rate when available + flagged, else awam. */
export function estimateBooking(f: RateLike, isKariah: boolean): Estimate {
  const rate = isKariah && f.rateKariah > 0 ? f.rateKariah : f.rateAwam;
  return { rate, deposit: f.deposit, total: rate + f.deposit };
}
