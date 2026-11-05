import { describe, it, expect } from "vitest";
import { validateProfile, safeNext } from "@/lib/profile";

describe("validateProfile", () => {
  it("requires a display name", () => {
    expect(validateProfile({ display_name: "", phone: "" })).toEqual({ ok: false, error: "Please enter your name." });
    expect(validateProfile({ display_name: "   ", phone: "" }).ok).toBe(false);
  });
  it("limits the name to 60 characters", () => {
    expect(validateProfile({ display_name: "x".repeat(61), phone: "" }).ok).toBe(false);
    expect(validateProfile({ display_name: "x".repeat(60), phone: "" }).ok).toBe(true);
  });
  it("normalizes phone numbers", () => {
    expect(validateProfile({ display_name: " Alice ", phone: "+358 40 123 4567" })).toEqual({
      ok: true,
      value: { display_name: "Alice", phone: "+358401234567" },
    });
    expect(validateProfile({ display_name: "A", phone: "040-123 4567" })).toEqual({
      ok: true,
      value: { display_name: "A", phone: "0401234567" },
    });
  });
  it("rejects invalid phones", () => {
    expect(validateProfile({ display_name: "A", phone: "abc" })).toEqual({
      ok: false,
      error: "Phone number should look like +358401234567.",
    });
    expect(validateProfile({ display_name: "A", phone: "123" }).ok).toBe(false);
  });
  it("treats an empty phone as none", () => {
    expect(validateProfile({ display_name: "A", phone: "" })).toEqual({ ok: true, value: { display_name: "A", phone: null } });
  });
});

describe("safeNext", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNext("/partners/x")).toBe("/partners/x");
    expect(safeNext("https://evil.com")).toBe("/partners");
    expect(safeNext("//evil.com")).toBe("/partners");
    expect(safeNext(null)).toBe("/partners");
  });
});
