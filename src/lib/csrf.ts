import crypto from "crypto";
import { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "./session";

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getCsrfToken(): Promise<string> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.csrfToken) {
    session.csrfToken = generateCsrfToken();
    await session.save();
  }
  return session.csrfToken;
}

export async function validateCsrfToken(
  request: NextRequest
): Promise<{ valid: boolean; newToken: string }> {
  const token = request.headers.get("x-csrf-token");
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn || !session.csrfToken || !token || session.csrfToken !== token) {
    return { valid: false, newToken: "" };
  }

  session.csrfToken = generateCsrfToken();
  await session.save();
  return { valid: true, newToken: session.csrfToken };
}
