import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { isStripeConfigured } from '@/lib/stripe';
import { isSubscriptionActive } from '@/lib/subscription';
import { SubscribeButton } from './SubscribeButton';
import { CheckCircle, Info, Warning } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Billing — MosRev',
  description: 'Manage your workspace subscription.',
};

const STATUS_STYLE: Record<string, string> = {
  trialing: 'bg-blue-50 text-blue-700 border-blue-100',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  past_due: 'bg-amber-50 text-amber-700 border-amber-100',
  canceled: 'bg-red-50 text-red-700 border-red-100',
  unpaid: 'bg-red-50 text-red-700 border-red-100',
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const { status: flow } = await searchParams;

  const org = await withOrg(session.orgId, (tx) =>
    tx.organization.findUnique({
      where: { id: session.orgId },
      select: {
        name: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    })
  );
  if (!org) redirect('/onboarding');

  const configured = isStripeConfigured();
  const active = isSubscriptionActive(org);
  const canManage = ['owner', 'admin'].includes(session.orgRole);
  const badgeCls = STATUS_STYLE[org.subscriptionStatus] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Billing</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{org.name}</p>
      </div>

      {flow === 'success' && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" weight="fill" aria-hidden="true" />
          <p className="text-sm text-emerald-800">Subscription confirmed. It may take a moment to reflect here.</p>
        </div>
      )}
      {flow === 'cancelled' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <Warning className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" weight="fill" aria-hidden="true" />
          <p className="text-sm text-amber-800">Checkout was cancelled. No changes were made.</p>
        </div>
      )}

      <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-950 text-sm">Subscription</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Current status of this workspace</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${badgeCls}`}>
            {org.subscriptionStatus.replace('_', ' ')}
          </span>
        </div>

        {org.currentPeriodEnd && (
          <div className="flex items-center justify-between py-2 border-t border-zinc-100 text-sm">
            <span className="text-zinc-500">Renews / ends</span>
            <span className="text-zinc-900">{org.currentPeriodEnd.toLocaleDateString()}</span>
          </div>
        )}

        {!configured ? (
          <div className="flex items-start gap-2 bg-zinc-50 border border-zinc-200/70 rounded-lg px-3 py-2.5">
            <Info className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" weight="duotone" aria-hidden="true" />
            <p className="text-sm text-zinc-600">
              Billing isn&apos;t enabled on this deployment — every workspace runs in trial mode with full access.
            </p>
          </div>
        ) : active ? (
          <p className="text-sm text-zinc-600">Your workspace is in good standing. Thank you for subscribing.</p>
        ) : canManage ? (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-zinc-600">Subscribe to keep full access to this workspace.</p>
            <SubscribeButton />
          </div>
        ) : (
          <p className="text-sm text-zinc-600">This workspace needs an active subscription. Ask an owner or admin to subscribe.</p>
        )}
      </div>
    </div>
  );
}
