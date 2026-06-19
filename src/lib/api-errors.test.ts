import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodErrorMessage } from "./api-errors";

describe("zodErrorMessage", () => {
  it("prefixes a single-level field path", () => {
    const result = z.object({ email: z.string() }).safeParse({ email: 123 });
    expect(result.success).toBe(false);
    if (result.success) return;
    const message = zodErrorMessage(result.error);
    expect(typeof message).toBe("string");
    expect(message.startsWith("email: ")).toBe(true);
  });

  it("dot-joins a nested field path", () => {
    const result = z
      .object({ user: z.object({ name: z.string() }) })
      .safeParse({ user: { name: 5 } });
    expect(result.success).toBe(false);
    if (result.success) return;
    const message = zodErrorMessage(result.error);
    expect(typeof message).toBe("string");
    expect(message.startsWith("user.name: ")).toBe(true);
  });

  it("omits the prefix when the issue path is empty", () => {
    const result = z.string().safeParse(123);
    expect(result.success).toBe(false);
    if (result.success) return;
    const issue = result.error.issues[0];
    expect(issue.path).toEqual([]);
    const message = zodErrorMessage(result.error);
    expect(typeof message).toBe("string");
    expect(message).toBe(issue.message);
  });

  it("uses only the first issue", () => {
    const result = z
      .object({ a: z.string(), b: z.number() })
      .safeParse({ a: 1, b: "x" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const err = result.error;
    const message = zodErrorMessage(err);
    expect(typeof message).toBe("string");
    expect(message).toBe(
      `${err.issues[0].path.join(".")}: ${err.issues[0].message}`
    );
  });

  it("falls back to 'Invalid input' when there are no issues", () => {
    const err = new z.ZodError([]);
    const message = zodErrorMessage(err);
    expect(typeof message).toBe("string");
    expect(message).toBe("Invalid input");
  });
});
