import clsx from 'clsx';

type WorkflowStatus = 'pending' | 'in_progress' | 'approved' | 'rejected';

const config: Record<WorkflowStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-600 border border-red-200' },
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

interface BadgeProps {
  status: WorkflowStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: BadgeProps) {
  const { label, classes } = config[status] ?? config['pending'];
  return (
    <span className={clsx('inline-flex items-center font-semibold rounded-full', classes, sizes[size])}>
      {label}
    </span>
  );
}

const BOOKING_COLORS: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  declined: 'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-zinc-50 text-zinc-500 border border-zinc-200',
};

function formatBookingLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

interface BookingBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BookingStatusBadge({ status, size = 'md' }: BookingBadgeProps) {
  const classes = BOOKING_COLORS[status] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  return (
    <span className={clsx('inline-flex items-center font-semibold rounded-full', classes, sizes[size])}>
      {formatBookingLabel(status)}
    </span>
  );
}
