/** HH:MM ranges overlap when each starts before the other ends (touching = no overlap). */
export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA;
}

/** A booking in one of these statuses holds the slot; new approvals must not collide. */
export const BLOCKING_STATUSES = new Set([
  "approved",
  "payment_review",
  "paid",
  "completed",
]);
