import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { prismaAdmin } from '@/lib/db';
import { CheckCircle, XCircle } from '@phosphor-icons/react/dist/ssr';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Invitation — MosRev',
  description:
    'Accept your invitation to join a MosRev organization and start managing structured approval workflows.',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const { token } = await params;

  const invite = await prismaAdmin.invitation.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  });

  const problemCard = (title: string, body: string) => (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" weight="duotone" aria-hidden="true" />
        <h1 className="text-lg font-bold text-zinc-950 mb-1">{title}</h1>
        <p className="text-sm text-zinc-500 mb-6">{body}</p>
        <Link href="/login" className="text-emerald-700 hover:text-emerald-800 font-medium text-sm">
          Go to sign in
        </Link>
      </div>
    </div>
  );

  if (!invite) {
    return problemCard(
      'Invitation not found',
      'This invite link doesn’t match any invitation. Check that you copied the whole link.'
    );
  }
  if (invite.acceptedAt) {
    return problemCard(
      'Invitation already accepted',
      'This invite has already been used. Sign in to reach the workspace.'
    );
  }
  if (invite.expiresAt < new Date()) {
    return problemCard(
      'Invitation expired',
      'This link is no longer valid. Ask the organization admin for a new invite.'
    );
  }

  const isLoggedIn = session.isLoggedIn;
  const emailMatch = isLoggedIn && session.email.toLowerCase() === invite.email.toLowerCase();

  // Auto-accept if logged in with matching email
  if (emailMatch) {
    const existingMember = await prismaAdmin.orgMember.findUnique({
      where: { orgId_userId: { orgId: invite.orgId, userId: session.userId } },
    });
    if (!existingMember) {
      await prismaAdmin.$transaction([
        prismaAdmin.orgMember.create({
          data: { orgId: invite.orgId, userId: session.userId, role: invite.role },
        }),
        prismaAdmin.invitation.update({
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
          <Logo className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-zinc-950">MosRev</span>
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
              <Link
                href={`/logout?redirect=/invites/${token}`}
                className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors text-center"
              >
                Switch account
              </Link>
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
                  className="text-emerald-700 hover:text-emerald-800 font-medium"
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
