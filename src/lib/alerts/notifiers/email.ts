export interface EmailNotifierOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export interface EmailNotifierResult {
  ok: boolean;
  status: number;
  messageId?: string;
  skipped?: boolean;
  reason?: string;
}

export class EmailNotifierError extends Error {
  readonly status?: number;
  readonly description?: string;

  constructor(message: string, status?: number, description?: string) {
    super(message);
    this.name = "EmailNotifierError";
    this.status = status;
    this.description = description;
  }
}

interface ResendApiResponse {
  id?: string;
  message?: string;
  name?: string;
}

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_EMAIL_FROM;
  if (!apiKey || !from) {
    return null;
  }
  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  return getResendConfig() !== null;
}

export async function sendEmailMessage(
  options: EmailNotifierOptions
): Promise<EmailNotifierResult> {
  const { to, subject, text, html, from: fromOverride } = options;

  if (!to) {
    throw new EmailNotifierError("to is required");
  }
  if (!subject) {
    throw new EmailNotifierError("subject is required");
  }
  if (!text && !html) {
    throw new EmailNotifierError("text or html body is required");
  }

  const config = getResendConfig();
  if (!config) {
    return {
      ok: false,
      status: 0,
      skipped: true,
      reason:
        "RESEND_API_KEY and/or ALERTS_EMAIL_FROM not configured; email notifier disabled",
    };
  }

  const body: Record<string, unknown> = {
    from: fromOverride ?? config.from,
    to: [to],
    subject,
  };
  if (text) body.text = text;
  if (html) body.html = html;

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new EmailNotifierError(`Resend API request failed: ${reason}`);
  }

  let payload: ResendApiResponse | null = null;
  try {
    payload = (await response.json()) as ResendApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new EmailNotifierError(
      `Resend API rejected send (HTTP ${response.status})`,
      response.status,
      payload?.message ?? payload?.name
    );
  }

  return {
    ok: true,
    status: response.status,
    messageId: payload?.id,
  };
}
