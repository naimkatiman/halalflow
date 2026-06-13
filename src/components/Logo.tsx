interface LogoProps {
  className?: string;
}

/**
 * MosRev brand mark: an 8-point Islamic Khatam star framing an approval-flow
 * branch (one node splitting into two). Mirrors src/app/icon.svg (the favicon /
 * app-icon source). Uses currentColor, so callers set color via a text-* class.
 * No hooks — safe in both server and client components.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M24 3 28.82 12.36 38.85 9.15 35.64 19.18 45 24 35.64 28.82 38.85 38.85 28.82 35.64 24 45 19.18 35.64 9.15 38.85 12.36 28.82 3 24 12.36 19.18 9.15 9.15 19.18 12.36Z"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 13.5V22 M16.5 22H31.5 M16.5 22V31 M31.5 22V31"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="13.5" r="2.8" fill="currentColor" />
      <circle cx="16.5" cy="31" r="2.8" fill="currentColor" />
      <circle cx="31.5" cy="31" r="2.8" fill="currentColor" />
    </svg>
  );
}
