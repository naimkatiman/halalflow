import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Page Not Found — MosRev",
  description: "The page you are looking for does not exist on MosRev.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold text-zinc-200 tabular-nums">404</h1>
      <p className="mt-4 text-lg font-medium text-zinc-950">Page not found</p>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" weight="bold" aria-hidden="true" />
        Back to dashboard
      </Link>
    </div>
  );
}
