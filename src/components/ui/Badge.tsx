import clsx from 'clsx';

// Single source of truth for workflow status colour + label across the app.
// 'pending' (the schema default) and 'in_progress' both mean "not yet decided"
// and render identically, matching how every workflow surface reads them.
const config: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Awaiting approval', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Awaiting approval', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
};

const fallback = { label: 'Unknown', classes: 'bg-zinc-100 text-zinc-700 border-zinc-200' };

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

/** Human label for a workflow status — e.g. for filter chips and links. */
export function statusLabel(status: string): string {
  return config[status]?.label ?? status.replaceAll('_', ' ');
}

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: BadgeProps) {
  const { label, classes } = config[status] ?? fallback;
  return (
    <span
      className={clsx('inline-flex items-center font-medium rounded-full border', classes, sizes[size], className)}
    >
      {label}
    </span>
  );
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: 'Menunggu',
  approved: 'Diluluskan',
  paid: 'Dibayar',
  completed: 'Selesai',
  declined: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const BOOKING_COLORS: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  declined: 'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-zinc-50 text-zinc-500 border border-zinc-200',
};

interface BookingBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BookingStatusBadge({ status, size = 'md' }: BookingBadgeProps) {
  const classes = BOOKING_COLORS[status] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  const label = BOOKING_STATUS_LABELS[status] ?? status;
  return (
    <span className={clsx('inline-flex items-center font-semibold rounded-full', classes, sizes[size])}>
      {label}
    </span>
  );
}
