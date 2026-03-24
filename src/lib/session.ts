import { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_halalflow",
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
  role: "",
  isLoggedIn: false,
};
