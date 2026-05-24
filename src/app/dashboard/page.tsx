import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/db';
import { CheckCircle, XCircle, Clock, ArrowRight, Plus } from '@phosphor-icons/react/dist/ssr';

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const [workflows, templates, org, totalWorkflows] = await Promise.all([
    prisma.workflow.findMany({
      where: { orgId: session.orgId },
      include: {
        template: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.workflowTemplate.count({ where: { orgId: session.orgId } }),
    prisma.organization.findUnique({ where: { id: session.orgId } }),
    prisma.workflow.count({ where: { orgId: session.orgId } }),
  ]);

  const stats = {
    total: totalWorkflows,
    inProgress: workflows.filter((w) => w.status === 'in_progress').length,
    approved: workflows.filter((w) => w.status === 'approved').length,
    rejected: workflows.filter((w) => w.status === 'rejected').length,
  };

  const statusConfig: Record<string, { label: string; cls: string }> = {
    in_progress: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-100' },
    cancelled: { label: 'Cancelled', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">{org?.name ?? 'Dashboard'}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Workflow overview</p>
        </div>
        <Link
          href="/workflows/new"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" weight="bold" />
          New workflow
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Clock, color: 'text-zinc-600' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-600' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <Icon className={`w-4 h-4 ${color} mb-3`} weight="fill" />
            <div className="text-3xl font-bold text-zinc-950 tabular-nums">{value}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200/70 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950 text-sm">Recent Workflows</h2>
            <Link href="/workflows" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {workflows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-400">No workflows yet.</p>
              <Link href="/workflows/new" className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-block">
                Create your first workflow →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {workflows.map((w) => {
                const sc = statusConfig[w.status] ?? statusConfig['pending'];
                return (
                  <Link
                    key={w.id}
                    href={`/workflows/${w.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-950 truncate group-hover:text-emerald-700 transition-colors">
                        {w.title}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{w.template.name} · {w.createdBy.name}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ml-3 ${sc.cls}`}>
                      {sc.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950 text-sm">Templates</h2>
            <Link href="/templates" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 space-y-2">
            <div className="text-3xl font-bold text-zinc-950 tabular-nums">{templates}</div>
            <p className="text-xs text-zinc-500">workflow templates defined</p>
            {templates === 0 && (
              <Link
                href="/templates/new"
                className="inline-block text-xs text-emerald-600 hover:text-emerald-700 mt-2"
              >
                Create a template →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
