import { describe, expect, it } from "vitest";
import { validateImageUpload, MAX_UPLOAD_BYTES } from "./upload";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe("validateImageUpload", () => {
  it("accepts a valid png", () => {
    expect(validateImageUpload(png, "image/png").ok).toBe(true);
  });
  it("accepts jpeg and webp", () => {
    expect(validateImageUpload(jpeg, "image/jpeg").ok).toBe(true);
    expect(validateImageUpload(webp, "image/webp").ok).toBe(true);
  });
  it("rejects a disallowed mime", () => {
    expect(validateImageUpload(png, "application/pdf").ok).toBe(false);
  });
  it("rejects mismatched magic bytes", () => {
    expect(validateImageUpload(jpeg, "image/png").ok).toBe(false);
  });
  it("rejects oversize", () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(png);
    expect(validateImageUpload(big, "image/png").ok).toBe(false);
  });
  it("rejects empty", () => {
    expect(validateImageUpload(new Uint8Array(0), "image/png").ok).toBe(false);
  });
});
