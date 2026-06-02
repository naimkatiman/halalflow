"use client";

import { useEffect } from "react";
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white text-zinc-950">
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h1 className="text-6xl font-bold text-zinc-200 tabular-nums">Error</h1>
          <p role="alert" className="mt-4 text-lg font-medium text-zinc-950">
            Something went wrong
          </p>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowClockwise className="w-4 h-4" weight="bold" aria-hidden />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
