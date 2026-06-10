import clsx from "clsx";

/**
 * Shimmer placeholder block. Compose several to mirror a page's layout in a
 * `loading.tsx`. Decorative — hidden from assistive tech.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton rounded-md", className)} aria-hidden="true" />;
}
