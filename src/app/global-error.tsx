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
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white text-zinc-950">
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h1 className="text-xl font-bold text-zinc-950">Something went wrong</h1>
          <p role="alert" className="mt-2 text-sm text-zinc-500 max-w-sm">
            An unexpected error occurred. Please try again.
            {error.digest ? (
              <>
                {" "}If it keeps happening, share reference{" "}
                <span className="font-mono text-zinc-600">{error.digest}</span> with support.
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowClockwise className="w-4 h-4" weight="bold" aria-hidden="true" />
            Try again
          </button>
          {process.env.NODE_ENV === "development" && error.message ? (
            <details className="mt-6 w-full max-w-lg text-left">
              <summary className="text-xs text-zinc-500 cursor-pointer">Technical details (development only)</summary>
              <pre className="mt-2 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200/70 rounded-lg p-3 whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </details>
          ) : null}
        </div>
      </body>
    </html>
  );
}
