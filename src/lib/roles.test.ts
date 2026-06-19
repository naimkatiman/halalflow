import { describe, expect, it } from "vitest";
import { roleSatisfies } from "./roles";

describe("roleSatisfies", () => {
  it.each([
    ["member", "member", true],
    ["member", "admin", false],
    ["member", "owner", false],
    ["admin", "member", true],
    ["admin", "admin", true],
    ["admin", "owner", false],
    ["owner", "member", true],
    ["owner", "admin", true],
    ["owner", "owner", true],
  ] as const)("evaluates %s against required %s as %s", (userRole, requiredRole, expected) => {
    expect(roleSatisfies(userRole, requiredRole)).toBe(expected);
  });

  it("rejects unknown user roles even when the required role is valid", () => {
    for (const userRole of ["", "viewer", "ADMIN", "Owner"]) {
      expect(roleSatisfies(userRole, "member")).toBe(false);
    }
  });

  it("rejects unknown required roles even for owners", () => {
    for (const requiredRole of ["", "viewer", "ADMIN", "Owner"]) {
      expect(roleSatisfies("owner", requiredRole)).toBe(false);
    }
  });
});
