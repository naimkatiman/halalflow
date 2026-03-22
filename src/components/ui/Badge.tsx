import clsx from 'clsx';
import type { ComplianceStatus } from '@/types';

interface BadgeProps {
  status: ComplianceStatus;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<ComplianceStatus, { label: string; classes: string }> = {
  HALAL: {
    label: 'HALAL',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  DOUBTFUL: {
    label: 'DOUBTFUL',
    classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  NON_COMPLIANT: {
    label: 'NON-COMPLIANT',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
  },
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function ComplianceBadge({ status, size = 'md' }: BadgeProps) {
  const { label, classes } = config[status];
  return (
    <span className={clsx('inline-flex items-center font-semibold rounded-full', classes, sizes[size])}>
      {label}
    </span>
  );
}
