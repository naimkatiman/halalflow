import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/db';
import { ArrowLeft, Plus } from '@phosphor-icons/react/dist/ssr';

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const { id } = await params;
  const template = await prisma.workflowTemplate.findFirst({
    where: { id, orgId: session.orgId },
    include: {
      steps: { orderBy: { order: 'asc' } },
      workflows: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: { select: { workflows: true } },
    },
  });
  if (!template) notFound();

  const statusCls: Record<string, string> = {
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };

  const canEdit = ['owner', 'admin'].includes(session.orgRole);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/templates" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">{template.name}</h1>
          {template.description && <p className="text-sm text-zinc-500 mt-0.5">{template.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workflows/new?templateId=${template.id}`}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" />
            Use template
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200/70 rounded-xl p-5">
          <h2 className="font-semibold text-zinc-950 text-sm mb-4">
            Approval steps <span className="text-zinc-400 font-normal">({template.steps.length})</span>
          </h2>
          <div className="space-y-2">
            {template.steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 py-2 border-b border-zinc-50 last:border-0">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">
                  {step.order + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-zinc-950">{step.name}</div>
                  {step.description && <div className="text-xs text-zinc-500 mt-0.5">{step.description}</div>}
                </div>
              </div>
            ))}
          </div>
          {canEdit && (
            <Link
              href={`/templates/${template.id}/edit`}
              className="mt-4 inline-block text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Edit steps →
            </Link>
          )}
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl p-5">
          <h2 className="font-semibold text-zinc-950 text-sm mb-4">
            Recent workflows <span className="text-zinc-400 font-normal">({template._count.workflows} total)</span>
          </h2>
          {template.workflows.length === 0 ? (
            <p className="text-xs text-zinc-400">No workflows from this template yet.</p>
          ) : (
            <div className="space-y-2">
              {template.workflows.map((w) => (
                <Link
                  key={w.id}
                  href={`/workflows/${w.id}`}
                  className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0 hover:text-emerald-700 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-950 truncate">{w.title}</div>
                    <div className="text-xs text-zinc-400">{w.createdBy.name}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ml-2 shrink-0 ${statusCls[w.status] ?? statusCls['pending']}`}>
                    {w.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
