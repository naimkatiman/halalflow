import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function CtaBand() {
  return (
    <section
      className="animate-fade-up overflow-hidden rounded-3xl bg-emerald-950 px-6 py-12 sm:px-12 sm:py-14"
      style={{ ["--index" as string]: 3 }}
    >
      <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        Start running your approvals today
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-emerald-200">
        Create a workspace, invite your team, and build your first template in
        minutes. No credit card, no setup call.
      </p>
      <Link
        href="/register"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50 active:translate-y-px"
      >
        Get started <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
      </Link>
    </section>
  );
}
