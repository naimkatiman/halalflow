"use client";

import { lerpPath } from "@/lib/morph/lerpPath";
import { useMorph } from "@/lib/morph/useMorph";
import { morphIcons, type MorphIconName } from "./morphIcons";

interface MorphIconProps {
  /** Which registered pair to render. */
  name: MorphIconName;
  /** false → state A (resting), true → state B (animates the morph). */
  active: boolean;
  /** Rendered px (the 256 grid scales to this). Default 24. */
  size?: number;
  /** Stroke width in grid units. Default 20 (~Phosphor regular weight). */
  strokeWidth?: number;
  /** Morph duration in ms. Default 320. */
  duration?: number;
  className?: string;
  /** Accessible label. When set the icon is exposed as an image; omitted = decorative. */
  title?: string;
}

export function MorphIcon({
  name,
  active,
  size = 24,
  strokeWidth = 20,
  duration = 320,
  className,
  title,
}: MorphIconProps) {
  const { a, b } = morphIcons[name];
  const t = useMorph(active, { duration });
  const d = lerpPath(a, b, t);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
