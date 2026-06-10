import { z } from "zod";

/**
 * Human-readable message from a Zod error — a plain string the client forms
 * can render directly. Returning `error.issues` (an array of objects) crashes
 * any form that does `setError(data.error)` and renders it as a React child.
 */
export function zodErrorMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
