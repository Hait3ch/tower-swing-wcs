import { describe, it, expect, vi } from "vitest";
import { registerCore, type RegisterDeps, type RegistrationInput } from "@/lib/tower/register";

const input: RegistrationInput = {
  firstName: "Aino",
  lastName: "Virtanen",
  email: "aino@example.com",
  phone: "+358401234567",
  experience: "intermediate",
};

function deps(over: Partial<RegisterDeps> = {}): RegisterDeps {
  return {
    rpc: vi.fn(async () => ({
      data: { payment_status: "pending", registration_date: "2026-11-05T10:00:00Z" },
      error: null,
    })),
    sendConfirmation: vi.fn(async () => {}),
    ...over,
  };
}

describe("registerCore", () => {
  it("registers and confirms by email", async () => {
    const d = deps();
    expect(await registerCore(input, d)).toEqual({ ok: true, isWaitingList: false, message: "Registration successful" });
    expect(d.rpc).toHaveBeenCalledWith({
      first_name: "Aino",
      last_name: "Virtanen",
      email: "aino@example.com",
      phone: "+358401234567",
      experience: "intermediate",
    });
    expect(d.sendConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ email: "aino@example.com", waitingListStatus: "none" }),
    );
  });

  it("reports the waiting list", async () => {
    const d = deps({
      rpc: vi.fn(async () => ({ data: { payment_status: "waiting", registration_date: "2026-11-05T10:00:00Z" }, error: null })),
    });
    expect(await registerCore(input, d)).toEqual({
      ok: true,
      isWaitingList: true,
      message: "Registration successful! You have been added to the waiting list.",
    });
    expect(d.sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({ waitingListStatus: "active" }));
  });

  it.each([
    ["duplicate_email", "A registration with this email already exists"],
    ["registration_closed", "Registration is currently closed for this event."],
    ["no_active_event", "No active event found. Registration is currently closed."],
    ["something else", "Registration failed. Please try again."],
  ])("maps %s to the old API message", async (code, message) => {
    const d = deps({ rpc: vi.fn(async () => ({ data: null, error: { message: code } })) });
    expect(await registerCore(input, d)).toEqual({ ok: false, message });
    expect(d.sendConfirmation).not.toHaveBeenCalled();
  });

  it("still succeeds when the email fails", async () => {
    const d = deps({ sendConfirmation: vi.fn(async () => Promise.reject(new Error("smtp down"))) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await registerCore(input, d)).ok).toBe(true);
    errSpy.mockRestore();
  });

  it("validates required fields like the old form", async () => {
    const d = deps();
    expect(await registerCore({ ...input, email: "nope" }, d)).toEqual({ ok: false, message: "Please enter a valid email" });
    expect(await registerCore({ ...input, firstName: " " }, d)).toEqual({ ok: false, message: "First name is required" });
    expect(await registerCore({ ...input, experience: "pro" as never }, d)).toEqual({
      ok: false,
      message: "Experience must be beginner, intermediate, or advanced",
    });
    expect(d.rpc).not.toHaveBeenCalled();
  });
});
