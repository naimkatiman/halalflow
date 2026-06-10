import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Consistent "nothing here yet" panel: framed icon, title, optional supporting
 * line, and an optional call-to-action. Renders in server or client components.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-zinc-400" weight="duotone" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {description && <p className="text-sm text-zinc-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
