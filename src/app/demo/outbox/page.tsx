import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { prismaAdmin } from '@/lib/db';
import { isDemoMode } from '@/lib/demo';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Email outbox — MosRev',
  description: 'Emails captured by demo mode instead of being sent.',
};

// The isDemoMode() gate reads env before any request API — force dynamic so
// a build without DEMO_MODE doesn't prerender this route as a permanent 404.
export const dynamic = 'force-dynamic';

export default async function DemoOutboxPage() {
  if (!isDemoMode()) notFound();

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');

  // prismaAdmin: DemoEmail is a demo-only global table with no tenant scoping —
  // there is nothing to scope with withOrg.
  const emails = await prismaAdmin.demoEmail.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Email outbox</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Emails the app would have sent — captured because demo mode is on.
        </p>
      </div>

      {emails.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <EnvelopeSimple className="w-8 h-8 text-zinc-300" weight="duotone" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-700">No emails yet</p>
          <p className="text-sm text-zinc-500">
            Trigger the trial lifecycle from the Billing page or invite a member — captured emails land here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <details key={email.id} className="bg-white border border-zinc-200/70 rounded-xl group">
              <summary className="px-4 py-3 cursor-pointer list-none flex items-start justify-between gap-4 hover:bg-zinc-50 rounded-xl transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{email.subject}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">To: {email.to}</p>
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap shrink-0 mt-0.5">
                  {email.createdAt.toLocaleString()}
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-zinc-100">
                {email.html ? (
                  <iframe
                    sandbox=""
                    srcDoc={email.html}
                    className="w-full h-80 bg-white rounded-lg border border-zinc-200"
                    title={email.subject}
                  />
                ) : (
                  <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans bg-zinc-50 border border-zinc-200/70 rounded-lg p-3">
                    {email.text}
                  </pre>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
