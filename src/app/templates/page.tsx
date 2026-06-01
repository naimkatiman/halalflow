import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/db';
import { Plus, Clipboard } from '@phosphor-icons/react/dist/ssr';
import { ImportButton } from './ImportButton';

export const metadata: Metadata = {
  title: 'Templates — HalalFlow',
  description:
    'Create and manage reusable workflow templates for your organization. Define multi-step approval processes.',
};

const PAGE_SIZE = 20;

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? '1'));

  const [templates, total] = await Promise.all([
    prisma.workflowTemplate.findMany({
      where: { orgId: session.orgId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { workflows: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.workflowTemplate.count({
      where: { orgId: session.orgId },
    }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Templates</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{total} templates</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportButton />
          <Link
            href="/templates/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" weight="bold" aria-hidden />
            New template
          </Link>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
          <p className="text-sm text-zinc-500">
            Page {page} of {pages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`?page=${page + 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 border-dashed rounded-xl p-12 text-center">
          <Clipboard className="w-8 h-8 text-zinc-300 mx-auto mb-3" weight="duotone" aria-hidden />
          <p className="text-sm font-medium text-zinc-500">No templates yet</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Templates define the steps in your approval workflows.</p>
          <Link
            href="/templates/new"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" aria-hidden />
            Create first template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/templates/${t.id}`}
              className="bg-white border border-zinc-200/70 rounded-xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Clipboard className="w-4 h-4 text-emerald-600" weight="duotone" aria-hidden />
                </div>
                <span className="text-xs text-zinc-400">{t._count.workflows} uses</span>
              </div>
              <h3 className="font-semibold text-zinc-950 text-sm group-hover:text-emerald-700 transition-colors">
                {t.name}
              </h3>
              {t.description && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{t.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {t.steps.map((s) => (
                  <span key={s.id} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                    {s.order + 1}. {s.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
