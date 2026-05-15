export interface TelegramNotifierOptions {
  chatId: string;
  message: string;
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
  disableWebPagePreview?: boolean;
}

export interface TelegramNotifierResult {
  ok: boolean;
  status: number;
  messageId?: number;
  description?: string;
}

export class TelegramNotifierError extends Error {
  readonly status?: number;
  readonly description?: string;

  constructor(message: string, status?: number, description?: string) {
    super(message);
    this.name = "TelegramNotifierError";
    this.status = status;
    this.description = description;
  }
}

interface TelegramApiResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
  error_code?: number;
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new TelegramNotifierError("TELEGRAM_BOT_TOKEN is not set");
  }
  return token;
}

export async function sendTelegramMessage(
  options: TelegramNotifierOptions
): Promise<TelegramNotifierResult> {
  const { chatId, message, parseMode, disableWebPagePreview } = options;

  if (!chatId) {
    throw new TelegramNotifierError("chatId is required");
  }
  if (!message) {
    throw new TelegramNotifierError("message is required");
  }

  const token = getBotToken();
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: message,
  };
  if (parseMode) body.parse_mode = parseMode;
  if (disableWebPagePreview !== undefined) {
    body.disable_web_page_preview = disableWebPagePreview;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new TelegramNotifierError(
      `Telegram API request failed: ${reason}`
    );
  }

  let payload: TelegramApiResponse | null = null;
  try {
    payload = (await response.json()) as TelegramApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new TelegramNotifierError(
      `Telegram API rejected sendMessage (HTTP ${response.status})`,
      response.status,
      payload?.description
    );
  }

  return {
    ok: true,
    status: response.status,
    messageId: payload.result?.message_id,
    description: payload.description,
  };
}
