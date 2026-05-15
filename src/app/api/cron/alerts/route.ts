import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateRules } from "@/lib/alerts/engine";
import {
  sendTelegramMessage,
  TelegramNotifierError,
} from "@/lib/alerts/notifiers/telegram";
import {
  sendEmailMessage,
  EmailNotifierError,
} from "@/lib/alerts/notifiers/email";

interface DeliveryOutcome {
  alertId: string;
  ruleId: string;
  channel: string;
  delivered: boolean;
  skipped?: boolean;
  reason?: string;
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed — never run unsecured.
    return false;
  }
  const headerSecret =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerSecret === secret;
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.alertRule.findMany({
    where: { active: true },
    include: { user: true },
  });

  if (rules.length === 0) {
    return NextResponse.json({
      evaluated: 0,
      triggered: 0,
      deliveries: [],
      errors: [],
    });
  }

  const { triggered, errors } = await evaluateRules(rules);
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const deliveries: DeliveryOutcome[] = [];

  for (const hit of triggered) {
    const rule = ruleById.get(hit.rule.id);
    if (!rule) continue;

    const alert = await prisma.alert.create({
      data: {
        ruleId: rule.id,
        priceAtTrigger: hit.price,
        delivered: false,
      },
    });

    const message =
      `HalalFlow alert: ${rule.symbol} is ${rule.condition} ${rule.threshold} ` +
      `(current price ${hit.price}).`;

    let delivered = false;
    let skipped = false;
    let reason: string | undefined;

    try {
      if (rule.channel === "telegram") {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!chatId) {
          skipped = true;
          reason = "TELEGRAM_CHAT_ID not configured";
        } else {
          await sendTelegramMessage({ chatId, message });
          delivered = true;
        }
      } else if (rule.channel === "email") {
        const result = await sendEmailMessage({
          to: rule.user.email,
          subject: `HalalFlow alert: ${rule.symbol}`,
          text: message,
        });
        if (result.skipped) {
          skipped = true;
          reason = result.reason;
        } else {
          delivered = result.ok;
        }
      } else {
        skipped = true;
        reason = `Unknown channel: ${rule.channel}`;
      }
    } catch (err: unknown) {
      if (
        err instanceof TelegramNotifierError ||
        err instanceof EmailNotifierError
      ) {
        reason = err.message;
      } else {
        reason = err instanceof Error ? err.message : String(err);
      }
    }

    if (delivered) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { delivered: true },
      });
    }

    deliveries.push({
      alertId: alert.id,
      ruleId: rule.id,
      channel: rule.channel,
      delivered,
      ...(skipped ? { skipped } : {}),
      ...(reason ? { reason } : {}),
    });
  }

  return NextResponse.json({
    evaluated: rules.length,
    triggered: triggered.length,
    deliveries,
    errors,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return runCron(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return runCron(request);
}
