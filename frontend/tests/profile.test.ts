import { describe, it, expect } from "vitest";
import { validateProfile as vp, safeNext } from "@/lib/profile";

const validateProfile = (i: { display_name: string; phone: string; whatsapp_username?: string; phone_ok?: boolean }) =>
  vp({ whatsapp_username: "", phone_ok: true, ...i });

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
      value: { display_name: "Alice", phone: "+358401234567", whatsapp_username: null },
    });
    expect(validateProfile({ display_name: "A", phone: "040-123 4567" })).toEqual({
      ok: true,
      value: { display_name: "A", phone: "0401234567", whatsapp_username: null },
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
    expect(validateProfile({ display_name: "A", phone: "" })).toEqual({ ok: true, value: { display_name: "A", phone: null, whatsapp_username: null } });
  });
  it("normalizes WhatsApp usernames", () => {
    expect(validateProfile({ display_name: "A", phone: "", whatsapp_username: " @Mira.Dances " })).toEqual({
      ok: true,
      value: { display_name: "A", phone: null, whatsapp_username: "mira.dances" },
    });
    expect(validateProfile({ display_name: "A", phone: "", whatsapp_username: "a b" }).ok).toBe(false);
  });
  it("requires consent to share a phone number", () => {
    expect(validateProfile({ display_name: "A", phone: "+358401234567", phone_ok: false }).ok).toBe(false);
  });
});

describe("safeNext", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNext("/partners/x")).toBe("/partners/x");
    expect(safeNext("https://evil.com")).toBe("/partners");
    expect(safeNext("//evil.com")).toBe("/partners");
    expect(safeNext(null)).toBe("/partners");
  });
  it("rejects control characters that browsers strip (open redirect)", () => {
    expect(safeNext("/\t/evil.com")).toBe("/partners");
    expect(safeNext("/\n/evil.com")).toBe("/partners");
    expect(safeNext("/%09/evil.com")).toBe("/%09/evil.com");
    expect(safeNext("/partners/x?y=1")).toBe("/partners/x?y=1");
  });
  it("never resolves to another origin", () => {
    for (const bad of ["/\\evil.com", "/\r//evil.com", "/ /evil.com"]) {
      expect(new URL(safeNext(bad), "https://towerswing.fi").origin).toBe("https://towerswing.fi");
    }
  });
});
