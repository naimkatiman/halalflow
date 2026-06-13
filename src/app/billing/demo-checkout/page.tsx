import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { isDemoBilling } from '@/lib/demo';
import Link from 'next/link';
import { DemoCheckoutForm } from './DemoCheckoutForm';
import { PLAN_NAME, PLAN_PRICE_LABEL } from '@/lib/billing-plan';
import { Warning } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Checkout — MosRev',
  description: 'Simulated checkout for the demo deployment.',
};

// The isDemoBilling() gate reads env before any request API — force dynamic so
// a build without DEMO_MODE doesn't prerender this route as a permanent 404.
export const dynamic = 'force-dynamic';

export default async function DemoCheckoutPage() {
  if (!isDemoBilling()) notFound();

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  if (!['owner', 'admin'].includes(session.orgRole)) redirect('/billing');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Warning className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" weight="fill" aria-hidden="true" />
        <p className="text-sm text-amber-800 font-medium">
          Simulated checkout — no real payment will be made.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-4 h-fit">
          <h1 className="font-semibold text-zinc-950 text-sm">Order summary</h1>
          <div className="flex items-start justify-between gap-4 py-2 border-t border-zinc-100 text-sm">
            <div>
              <p className="text-zinc-900 font-medium">{PLAN_NAME}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Workspace subscription</p>
            </div>
            <p className="text-zinc-900 font-medium whitespace-nowrap">{PLAN_PRICE_LABEL}</p>
          </div>
          <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200/70 rounded-lg px-3 py-2">
            Demo price — the real price is configured in Stripe.
          </p>
        </div>

        <DemoCheckoutForm name={session.name || 'Demo Card'} />
      </div>

      <p className="text-center text-sm">
        <Link href="/billing?status=cancelled" className="text-zinc-500 hover:text-zinc-800 transition-colors">
          Cancel and return to billing
        </Link>
      </p>
    </div>
  );
}
