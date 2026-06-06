import { sendEmail, type EmailMessage, escapeHtml } from './email';

export function buildInviteEmail(
  to: string,
  orgName: string,
  inviteUrl: string,
  invitedByName: string
): EmailMessage {
  const subject = `You've been invited to join ${orgName} on HalalFlow`;
  const text = `Hi there,

${invitedByName} has invited you to join ${orgName} on HalalFlow — an Islamic finance workflow approval platform.

Accept your invitation: ${inviteUrl}

This link expires in 7 days.

— HalalFlow`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #27272a;">
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">You're invited to ${escapeHtml(orgName)}</h2>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
    <strong>${escapeHtml(invitedByName)}</strong> has invited you to join <strong>${escapeHtml(orgName)}</strong> on HalalFlow — an Islamic finance workflow approval platform.
  </p>
  <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">
    Accept Invitation
  </a>
  <p style="font-size: 12px; color: #71717a; margin-top: 16px;">
    This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
  </p>
</body>
</html>`;

  return { to, subject, text, html };
}

export async function sendInviteEmail(
  to: string,
  orgName: string,
  inviteUrl: string,
  invitedByName: string
) {
  return sendEmail(buildInviteEmail(to, orgName, inviteUrl, invitedByName));
}
