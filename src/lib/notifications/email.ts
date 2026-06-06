const RESEND_API_URL = 'https://api.resend.com/emails';

export type EmailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export type EmailSendResult =
  | { ok: true; skipped?: false; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; reason: string };

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.HALALFLOW_EMAIL_FROM?.trim();
  return { apiKey, from };
}

export function isEmailConfigured() {
  const { apiKey, from } = getEmailConfig();
  return Boolean(apiKey && from);
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const { apiKey, from } = getEmailConfig();

  if (!apiKey || !from) {
    return {
      ok: false,
      skipped: true,
      reason: 'Email notifications are disabled until RESEND_API_KEY and HALALFLOW_EMAIL_FROM are set.',
    };
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  const payload = await res.json().catch((err) => {
    console.error('Resend JSON parse error:', err);
    return null;
  });

  if (!res.ok) {
    return {
      ok: false,
      reason: payload?.message || payload?.error || `Email provider responded with HTTP ${res.status}`,
    };
  }

  return {
    ok: true,
    id: payload?.id,
  };
}

export type WorkflowDecisionEmailInput = {
  workflowTitle: string;
  workflowStatus: 'approved' | 'rejected';
  stepName: string;
  actorName: string;
  note?: string | null;
  recipients: string[];
  orgName?: string;
  workflowId?: string;
};

export function buildWorkflowDecisionEmail(input: WorkflowDecisionEmailInput) {
  const subject = `[HalalFlow] ${input.workflowTitle} — ${input.workflowStatus}`;
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const workflowUrl = input.workflowId ? `${baseUrl}/workflows/${input.workflowId}` : null;

  const textLines = [
    `Workflow: ${input.workflowTitle}`,
    `Step: ${input.stepName}`,
    `Action: ${input.workflowStatus}`,
    `By: ${input.actorName}`,
    `Organization: ${input.orgName}`,
    input.note?.trim() ? `Note: ${input.note.trim()}` : null,
    workflowUrl ? `\nOpen workflow: ${workflowUrl}` : null,
  ];

  const text = textLines.filter(Boolean).join('\n');

  const statusColor = input.workflowStatus === 'approved' ? '#059669' : '#dc2626';
  const statusLabel = input.workflowStatus.charAt(0).toUpperCase() + input.workflowStatus.slice(1);

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #27272a;">
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">${input.workflowTitle}</h2>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
    <strong style="color: ${statusColor};">${statusLabel}</strong> — Step "${input.stepName}" was ${input.workflowStatus} by <strong>${input.actorName}</strong> in <strong>${input.orgName}</strong>.
  </p>
  ${input.note?.trim() ? `<p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px; padding: 12px; background: #f4f4f5; border-radius: 8px;"><strong>Note:</strong> ${input.note.trim()}</p>` : ''}
  ${workflowUrl ? `<a href="${workflowUrl}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">View Workflow</a>` : ''}
  <p style="font-size: 12px; color: #71717a; margin-top: 16px;">
    This is an automated notification from HalalFlow.
  </p>
</body>
</html>`;

  return { subject, text, html };
}
