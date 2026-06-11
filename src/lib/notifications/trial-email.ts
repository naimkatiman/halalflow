import { type EmailMessage, escapeHtml } from './email';

// Org names land in subjects and plain-text bodies where escapeHtml doesn't
// apply; collapse control characters so a crafted name can't mangle either.
function plainName(orgName: string): string {
  return orgName.replace(/[\r\n\t]+/g, ' ').trim();
}

function layout(heading: string, bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #27272a;">
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">${heading}</h2>
  ${bodyHtml}
  <a href="${escapeHtml(ctaUrl)}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">
    ${ctaLabel}
  </a>
  <p style="font-size: 12px; color: #71717a; margin-top: 16px;">
    You're receiving this because you manage this workspace on MosRev.
  </p>
</body>
</html>`;
}

export function buildTrialReminderEmail(
  to: string[],
  orgName: string,
  daysLeft: number,
  billingUrl: string
): EmailMessage {
  const name = plainName(orgName);
  const days = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
  const subject = `Your MosRev trial for ${name} ends in ${days}`;
  const text = `Assalamualaikum,

The free trial for ${name} on MosRev ends in ${days}. After that, your team keeps its data but loses access to workflows and approvals until a subscription is set up.

Subscribe here: ${billingUrl}

If you've decided MosRev isn't for you, no action is needed.

— MosRev`;
  const html = layout(
    `Your trial ends in ${days}`,
    `<p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      The free trial for <strong>${escapeHtml(name)}</strong> ends in <strong>${days}</strong>.
      After that, your team keeps its data but loses access to workflows and approvals
      until a subscription is set up.
    </p>`,
    billingUrl,
    'Set up billing'
  );
  return { to, subject, text, html };
}

export function buildTrialWinbackEmail(to: string[], orgName: string, billingUrl: string): EmailMessage {
  const name = plainName(orgName);
  const subject = `Your MosRev workspace ${name} is waiting for you`;
  const text = `Assalamualaikum,

The free trial for ${name} ended last week. Everything your team set up — templates, workflows, the audit trail — is still there, exactly as you left it.

Pick up where you left off: ${billingUrl}

If now isn't the right time, this is the last email we'll send about it.

— MosRev`;
  const html = layout(
    'Your workspace is waiting',
    `<p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      The free trial for <strong>${escapeHtml(name)}</strong> ended last week. Everything
      your team set up — templates, workflows, the audit trail — is still there, exactly
      as you left it.
    </p>`,
    billingUrl,
    'Pick up where you left off'
  );
  return { to, subject, text, html };
}
