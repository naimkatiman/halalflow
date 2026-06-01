import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/db';
import { InviteMemberForm } from './InviteMemberForm';
import { OrgSwitcher } from './OrgSwitcher';
import { Buildings, Users, PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Settings — HalalFlow',
  description:
    "Manage your organization's members, switch workspaces, and configure HalalFlow preferences.",
};

export default async function SettingsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const org = await prisma.organization.findUnique({
    where: { id: session.orgId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!org) redirect('/onboarding');

  const canInvite = ['owner', 'admin'].includes(session.orgRole);

  const pendingInvites = canInvite
    ? await prisma.invitation.findMany({
        where: { orgId: session.orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const memberships = await prisma.orgMember.findMany({
    where: { userId: session.userId },
    include: { org: true },
    orderBy: { createdAt: 'asc' },
  });

  const userOrgs = memberships.map((m) => ({
    id: m.org.id,
    name: m.org.name,
    slug: m.org.slug,
    role: m.role,
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your workspace</p>
      </div>

      {userOrgs.length > 1 && (
        <OrgSwitcher orgs={userOrgs} currentOrgId={session.orgId} />
      )}

      <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Buildings className="w-4 h-4 text-zinc-400" aria-hidden />
          <h2 className="font-semibold text-zinc-950 text-sm">Organization</h2>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-2 border-b border-zinc-100">
            <span className="text-sm text-zinc-500">Name</span>
            <span className="text-sm font-medium text-zinc-950">{org.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-zinc-100">
            <span className="text-sm text-zinc-500">Slug</span>
            <span className="text-sm font-mono text-zinc-700">{org.slug}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-500">Your role</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 capitalize">
              {session.orgRole}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" aria-hidden />
          <h2 className="font-semibold text-zinc-950 text-sm">Members ({org.members.length})</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {org.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-zinc-950">{m.user.name}</div>
                <div className="text-xs text-zinc-400">{m.user.email}</div>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 capitalize">
                {m.role}
              </span>
            </div>
          ))}
        </div>
        {canInvite && pendingInvites.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 space-y-2">
            <div className="flex items-center gap-2">
              <PaperPlaneTilt className="w-3.5 h-3.5 text-zinc-400" aria-hidden />
              <p className="text-xs font-semibold text-zinc-700">Pending invitations ({pendingInvites.length})</p>
            </div>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-zinc-600">{invite.email}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 capitalize">
                  {invite.role}
                </span>
              </div>
            ))}
          </div>
        )}
        {canInvite && <InviteMemberForm orgId={session.orgId} />}
      </div>
    </div>
  );
}
