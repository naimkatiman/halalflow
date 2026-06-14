import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { CheckCircle, XCircle, Clock, ArrowsClockwise, ArrowRight, Plus } from '@phosphor-icons/react/dist/ssr';
import { StatusBadge } from '@/components/ui/Badge';
import { getLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Dashboard — MosRev',
  description:
    'Overview of your organization\'s workflows, recent activity, and key statistics.',
};

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  const { workflows, templates, org, totalWorkflows, inProgressCount, approvedCount, rejectedCount } = await withOrg(session.orgId, async (tx) => {
    const [workflows, templates, org, totalWorkflows, inProgressCount, approvedCount, rejectedCount] = await Promise.all([
      tx.workflow.findMany({
        where: { orgId: session.orgId },
        include: {
          template: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      tx.workflowTemplate.count({ where: { orgId: session.orgId } }),
      tx.organization.findUnique({ where: { id: session.orgId } }),
      tx.workflow.count({ where: { orgId: session.orgId } }),
      tx.workflow.count({ where: { orgId: session.orgId, status: { in: ['in_progress', 'pending'] } } }),
      tx.workflow.count({ where: { orgId: session.orgId, status: 'approved' } }),
      tx.workflow.count({ where: { orgId: session.orgId, status: 'rejected' } }),
    ]);
    return { workflows, templates, org, totalWorkflows, inProgressCount, approvedCount, rejectedCount };
  });

  const t = getDictionary(await getLocale());
  const stats = {
    total: totalWorkflows,
    inProgress: inProgressCount,
    approved: approvedCount,
    rejected: rejectedCount,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{org?.name ?? t.dashboard.fallbackTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t.dashboard.subtitle}</p>
        </div>
        <Link
          href="/workflows/new"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" weight="bold" aria-hidden="true" />
          {t.dashboard.newWorkflow}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.dashboard.statTotal, value: stats.total, icon: Clock, color: 'text-zinc-600 dark:text-zinc-300', href: '/workflows' },
          { label: t.dashboard.statAwaiting, value: stats.inProgress, icon: ArrowsClockwise, color: 'text-blue-600', href: '/workflows?status=in_progress' },
          { label: t.dashboard.statApproved, value: stats.approved, icon: CheckCircle, color: 'text-emerald-600', href: '/workflows?status=approved' },
          { label: t.dashboard.statRejected, value: stats.rejected, icon: XCircle, color: 'text-red-600', href: '/workflows?status=rejected' },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={href} href={href} className="bg-white border border-zinc-200/70 rounded-xl p-5 hover:border-zinc-300 transition-colors block dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700">
            <Icon className={`w-4 h-4 ${color} mb-3`} weight="fill" aria-hidden="true" />
            <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tabular-nums">{value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200/70 rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50 text-sm">{t.dashboard.recentWorkflows}</h2>
            <Link href="/workflows" className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1">
              {t.dashboard.viewAll} <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          {workflows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.dashboard.noWorkflows}</p>
              <Link href="/workflows/new" className="text-sm text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mt-2 inline-block">
                {t.dashboard.createFirstWorkflow}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {workflows.map((w) => {
                return (
                  <Link
                    key={w.id}
                    href={`/workflows/${w.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {w.title}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{w.template.name} · {w.createdBy.name}</div>
                    </div>
                    <StatusBadge status={w.status} className="shrink-0 ml-3" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50 text-sm">{t.dashboard.templates}</h2>
            <Link href="/templates" className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1">
              {t.dashboard.viewAll} <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="p-5 space-y-2">
            <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tabular-nums">{templates}</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.dashboard.templatesDefined}</p>
            {templates === 0 && (
              <Link
                href="/templates/new"
                className="inline-block text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mt-2"
              >
                {t.dashboard.createTemplate}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
