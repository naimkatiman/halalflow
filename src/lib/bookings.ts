export const BOOKING_STATUSES = [
  "requested", "approved", "paid", "completed", "declined", "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_ACTIONS = [
  "approve", "decline", "record_payment", "complete", "cancel",
] as const;
export type BookingAction = (typeof BOOKING_ACTIONS)[number];

export const EVENT_TYPES = [
  "kenduri", "akad_nikah", "mesyuarat", "kelas", "kursus", "lain_lain",
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  kenduri: "Kenduri",
  akad_nikah: "Akad Nikah",
  mesyuarat: "Mesyuarat",
  kelas: "Kelas",
  kursus: "Kursus",
  lain_lain: "Lain-lain",
};

export const FACILITY_TYPES = [
  "dewan", "bilik_mesyuarat", "bilik_kuliah", "khemah", "dapur",
] as const;

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  dewan: "Dewan",
  bilik_mesyuarat: "Bilik Mesyuarat",
  bilik_kuliah: "Bilik Kuliah",
  khemah: "Khemah",
  dapur: "Dapur",
};

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["approved", "declined", "cancelled"],
  approved: ["paid", "cancelled"],
  paid: ["completed"],
  completed: [],
  declined: [],
  cancelled: [],
};

const ACTION_TARGET: Record<BookingAction, BookingStatus> = {
  approve: "approved",
  decline: "declined",
  record_payment: "paid",
  complete: "completed",
  cancel: "cancelled",
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from as BookingStatus] ?? []).includes(to as BookingStatus);
}

export function resolveAction(action: BookingAction): BookingStatus {
  return ACTION_TARGET[action];
}

export interface ActionInput {
  quotedAmount?: number;
  depositAmount?: number;
  declineReason?: string;
  paymentAmount?: number;
  paymentNote?: string;
}

export function validateActionInput(
  action: BookingAction,
  input: ActionInput,
): { ok: true } | { ok: false; error: string } {
  if (action === "approve" && !(typeof input.quotedAmount === "number" && input.quotedAmount > 0)) {
    return { ok: false, error: "Approval requires a positive quoted amount" };
  }
  if (action === "decline" && !input.declineReason?.trim()) {
    return { ok: false, error: "Decline requires a reason" };
  }
  if (action === "record_payment" && !(typeof input.paymentAmount === "number" && input.paymentAmount > 0)) {
    return { ok: false, error: "Recording payment requires a positive amount" };
  }
  return { ok: true };
}
