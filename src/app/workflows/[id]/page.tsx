import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { roleSatisfies } from '@/lib/roles';
import { ArrowLeft, CheckCircle, XCircle, Clock, ChatCircle, FileArrowDown } from '@phosphor-icons/react/dist/ssr';
import { ApprovalActions } from './ApprovalActions';
import { CommentForm } from './CommentForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workflow Details — MosRev',
  description:
    'Track the status of a submitted workflow, view approval steps, add comments, and see the full audit log.',
};

const STATUS_CLS: Record<string, string> = {
  in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Awaiting approval',
};

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');

  const { id } = await params;
  const workflow = await withOrg(session.orgId, async (tx) =>
    tx.workflow.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        template: { include: { steps: { orderBy: { order: 'asc' } } } },
        createdBy: { select: { id: true, name: true, email: true } },
        approvals: {
          include: {
            step: true,
            approver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  );
  if (!workflow) notFound();

  const currentApproval = workflow.approvals.find(
    (a) => a.status === 'pending' && a.step.order === workflow.currentStep
  );
  const isActive = ['in_progress', 'pending'].includes(workflow.status);
  const canApprove = !currentApproval?.step.requiredRole || roleSatisfies(session.orgRole, currentApproval.step.requiredRole);
  const sc = STATUS_CLS[workflow.status] ?? STATUS_CLS['pending'];

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/workflows" aria-label="Go back" className="text-zinc-400 hover:text-zinc-700 transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">{workflow.title}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc}`}>
              {STATUS_LABELS[workflow.status] ?? workflow.status}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {workflow.template.name} · Submitted by {workflow.createdBy.name} · {formatDate(workflow.createdAt)}
          </p>
          {workflow.description && (
            <p className="text-sm text-zinc-600 mt-2 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3">
              {workflow.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <h2 className="font-semibold text-zinc-950 text-sm mb-4">Approval Steps</h2>
            <ol className="space-y-3">
              {workflow.approvals.map((approval) => {
                const isCurrent = approval.step.order === workflow.currentStep && isActive;
                const isDone = approval.status === 'approved';
                const isRejected = approval.status === 'rejected';
                return (
                  <li
                    key={approval.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isCurrent
                        ? 'bg-blue-50/50 border-blue-100'
                        : isDone
                        ? 'bg-emerald-50/30 border-emerald-100/50'
                        : isRejected
                        ? 'bg-red-50/30 border-red-100/50'
                        : 'border-zinc-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" weight="fill" aria-hidden="true" />
                      ) : isRejected ? (
                        <XCircle className="w-4 h-4 text-red-500" weight="fill" aria-hidden="true" />
                      ) : (
                        <Clock className={`w-4 h-4 ${isCurrent ? 'text-blue-500' : 'text-zinc-300'}`} weight="fill" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-950">{approval.step.name}</span>
                        <span className="text-xs text-zinc-400 shrink-0">Step {approval.step.order + 1}</span>
                      </div>
                      {approval.step.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{approval.step.description}</p>
                      )}
                      {approval.approver && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {isDone ? '✓ Approved' : '✗ Rejected'} by {approval.approver.name}
                          {approval.note && ` — "${approval.note}"`}
                        </p>
                      )}
                      {isCurrent && (
                        <p className="text-xs text-blue-600 font-medium mt-1">Awaiting approval</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {currentApproval && isActive && workflow.createdById !== session.userId && (
            canApprove ? (
              <ApprovalActions workflowId={workflow.id} stepName={currentApproval.step.name} />
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  This step requires the <span className="font-semibold">{currentApproval.step.requiredRole}</span> role (or above) to approve.
                </p>
              </div>
            )
          )}

          <div className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <h2 className="font-semibold text-zinc-950 text-sm mb-4 flex items-center gap-1.5">
              <ChatCircle className="w-4 h-4 text-zinc-400" aria-hidden="true" />
              Comments
              {workflow.comments.length > 0 && (
                <span className="text-zinc-400 font-normal">({workflow.comments.length})</span>
              )}
            </h2>
            {workflow.comments.length === 0 ? (
              <p className="text-xs text-zinc-400 mb-4">No comments yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {workflow.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-xs font-semibold text-zinc-600">
                      {c.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-zinc-900">{c.user.name}</span>
                        <span className="text-xs text-zinc-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-700 mt-0.5">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <CommentForm workflowId={workflow.id} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <h2 className="font-semibold text-zinc-950 text-sm mb-3">Activity</h2>
            <div className="space-y-3">
              {workflow.auditLogs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      {log.user && <span className="font-medium">{log.user.name} </span>}
                      {log.detail ?? log.action}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {workflow.status === 'approved' && (
            <a
              href={`/api/workflows/${workflow.id}/receipt`}
              download
              className="flex items-center gap-2 w-full bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <FileArrowDown className="w-4 h-4" aria-hidden="true" />
              Download receipt
            </a>
          )}

          <div className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <h2 className="font-semibold text-zinc-950 text-sm mb-3">Progress</h2>
            <div className="text-2xl font-bold text-zinc-950 tabular-nums">
              {workflow.approvals.filter((a) => a.status === 'approved').length}
              <span className="text-sm font-normal text-zinc-400"> / {workflow.approvals.length}</span>
            </div>
            <p className="text-xs text-zinc-500">steps completed</p>
            <div
              className="mt-3 h-2 bg-zinc-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={workflow.approvals.length}
              aria-valuenow={workflow.approvals.filter((a) => a.status === 'approved').length}
              aria-label="Workflow approval progress"
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${(workflow.approvals.filter((a) => a.status === 'approved').length / Math.max(workflow.approvals.length, 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
