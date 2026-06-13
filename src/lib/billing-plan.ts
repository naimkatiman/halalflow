// Display details for the workspace subscription. In demo mode this is the
// simulated price shown on the billing card and the simulated checkout; with
// real Stripe the authoritative amount lives in Stripe. Sourcing the figure
// here keeps the billing card, the checkout summary, and the pay button from
// drifting out of sync.
export const PLAN_NAME = 'MosRev Pro';
export const PLAN_PRICE = 'RM99.00';
export const PLAN_PERIOD = 'month';

/** e.g. "RM99.00 / month" */
export const PLAN_PRICE_LABEL = `${PLAN_PRICE} / ${PLAN_PERIOD}`;
