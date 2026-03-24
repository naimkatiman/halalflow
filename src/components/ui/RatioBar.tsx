import clsx from 'clsx';

interface RatioBarProps {
  label: string;
  value: number;
  threshold: number;
  format?: 'percent' | 'decimal';
}

export function RatioBar({ label, value, threshold, format = 'percent' }: RatioBarProps) {
  const pct = Math.min(value / threshold, 1.5);
  const passing = value <= threshold;
  const fillWidth = Math.min(pct * 100, 100);

  const display = format === 'percent'
    ? `${(value * 100).toFixed(1)}%`
    : value.toFixed(4);

  const thresholdDisplay = format === 'percent'
    ? `${(threshold * 100).toFixed(0)}%`
    : threshold.toFixed(2);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className={clsx('font-semibold', passing ? 'text-emerald-600' : 'text-red-500')} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {display}
          </span>
          <span className="text-zinc-400 text-xs">/ {thresholdDisplay} limit</span>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', passing ? 'bg-emerald-500' : 'bg-red-500')}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
    </div>
  );
}
