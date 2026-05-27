import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/db';
import { GitBranch, CheckCircle, XCircle } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Invitation — HalalFlow',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const { token } = await params;

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" weight="duotone" aria-hidden="true" />
          <h1 className="text-lg font-bold text-zinc-950 mb-1">Invitation expired</h1>
          <p className="text-sm text-zinc-500 mb-6">
            This link is no longer valid. Ask the organization admin for a new invite.
          </p>
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const isLoggedIn = session.isLoggedIn;
  const emailMatch = isLoggedIn && session.email.toLowerCase() === invite.email.toLowerCase();

  // Auto-accept if logged in with matching email
  if (emailMatch) {
    const existingMember = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: invite.orgId, userId: session.userId } },
    });
    if (!existingMember) {
      await prisma.$transaction([
        prisma.orgMember.create({
          data: { orgId: invite.orgId, userId: session.userId, role: invite.role },
        }),
        prisma.invitation.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ]);
      session.orgId = invite.orgId;
      session.orgRole = invite.role;
      await session.save();
    }
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <GitBranch className="w-5 h-5 text-emerald-600" weight="bold" aria-hidden="true" />
          <span className="font-bold text-zinc-950">HalalFlow</span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" weight="duotone" aria-hidden="true" />
          <h1 className="text-lg font-bold text-zinc-950 mb-1">You&apos;re invited</h1>
          <p className="text-sm text-zinc-500 mb-6">
            <strong>{invite.org.name}</strong> has invited you to join as a{' '}
            <span className="capitalize">{invite.role}</span>.
          </p>

          {isLoggedIn ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                You&apos;re signed in as <strong>{session.email}</strong>, but this invite is for{' '}
                <strong>{invite.email}</strong>.
              </p>
              <a
                href={`/logout?redirect=/invites/${token}`}
                className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Switch account
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/register?invite=${token}&email=${encodeURIComponent(invite.email)}`}
                className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors text-center"
              >
                Create account
              </Link>
              <p className="text-sm text-zinc-500">
                Already have an account?{' '}
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/invites/${token}`)}`}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
