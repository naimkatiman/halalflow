import { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  orgRole: string;
  isLoggedIn: boolean;
  csrfToken?: string;
}

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    // During Next.js build the module is loaded in production mode;
    // allow the build to complete and enforce the secret at runtime.
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("SESSION_SECRET is required in production");
    }
    // In dev, require an explicit secret to prevent accidental deployment
    // with a predictable fallback. The build phase is exempt so CI/CD works.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return "__build_placeholder_do_not_use_in_runtime__";
    }
    throw new Error("SESSION_SECRET is required. Set a random 32+ character string in .env");
  }
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long");
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "halalflow_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export const defaultSession: SessionData = {
  userId: "",
  email: "",
  name: "",
  role: "",
  orgId: "",
  orgRole: "",
  isLoggedIn: false,
};
