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

  const payload = await res.json().catch(() => null);

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
};

export function buildWorkflowDecisionEmail(input: WorkflowDecisionEmailInput) {
  const subject = `[HalalFlow] ${input.workflowTitle} ${input.workflowStatus}`;
  const text = [
    `Workflow: ${input.workflowTitle}`,
    `Step: ${input.stepName}`,
    `Action: ${input.workflowStatus}`,
    `By: ${input.actorName}`,
    `Organization: ${input.orgName}`,
    input.note?.trim() ? `Note: ${input.note.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    text,
  };
}
