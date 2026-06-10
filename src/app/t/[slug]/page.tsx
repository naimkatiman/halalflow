import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { resolveTenant } from '@/lib/require-org';
import { EmptyState } from '@/components/ui/EmptyState';
import { EnterWorkspace } from './EnterWorkspace';
import { LockKey } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Open workspace — MosRev',
  robots: { index: false },
};

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    redirect(`/login?redirect=${encodeURIComponent(`/t/${slug}`)}`);
  }

  const tenant = await resolveTenant(session.userId, slug);
  if (!tenant) notFound();

  // Authenticated but not a member: deny access. The session is never modified,
  // so the caller cannot reach this tenant's data.
  if (tenant.role === null) {
    return (
      <EmptyState
        icon={LockKey}
        title="You don't have access to this workspace"
        description="Your account isn't a member of this organization. Ask an owner or admin to invite you."
        action={
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  // Already the active org → straight to the dashboard.
  if (session.orgId === tenant.org.id) {
    redirect('/dashboard');
  }

  // Member of another of their orgs → switch the active org, then redirect.
  return <EnterWorkspace orgId={tenant.org.id} orgName={tenant.org.name} />;
}
