import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/db';
import { Plus, FunnelSimple } from '@phosphor-icons/react/dist/ssr';

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'In Progress',
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

const STATUS_CLS: Record<string, string> = {
  in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const PAGE_SIZE = 20;

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const { status, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? '1'));

  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where: { orgId: session.orgId, ...(status ? { status } : {}) },
      include: {
        template: { select: { name: true } },
        createdBy: { select: { name: true } },
        approvals: { select: { status: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.workflow.count({
      where: { orgId: session.orgId, ...(status ? { status } : {}) },
    }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const filters = ['', 'in_progress', 'approved', 'rejected'] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Workflows</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{workflows.length} workflows</p>
        </div>
        <Link
          href="/workflows/new"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" weight="bold" />
          New workflow
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <FunnelSimple className="w-3.5 h-3.5 text-zinc-400" />
        {filters.map((f) => (
          <Link
            key={f}
            href={f ? `/workflows?status=${f}` : '/workflows'}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              status === f || (!status && !f)
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f ? STATUS_LABELS[f] : 'All'}
          </Link>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
          <p className="text-sm text-zinc-500">
            Page {page} of {pages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={status ? `?status=${status}&page=${page - 1}` : `?page=${page - 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={status ? `?status=${status}&page=${page + 1}` : `?page=${page + 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 border-dashed rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No workflows found</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            {status ? 'Try a different filter.' : 'Create your first workflow from a template.'}
          </p>
          {!status && (
            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
              New workflow
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
          {workflows.map((w) => {
            const sc = STATUS_CLS[w.status] ?? STATUS_CLS['pending'];
            const completedSteps = w.approvals.filter((a) => a.status === 'approved').length;
            const totalSteps = w.approvals.length;
            return (
              <Link
                key={w.id}
                href={`/workflows/${w.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-950 group-hover:text-emerald-700 transition-colors truncate">
                      {w.title}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {w.template.name} · {w.createdBy.name} · {completedSteps}/{totalSteps} steps
                    {w._count.comments > 0 && ` · ${w._count.comments} comments`}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ml-4 ${sc}`}>
                  {STATUS_LABELS[w.status] ?? w.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
