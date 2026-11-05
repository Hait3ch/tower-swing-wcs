import { describe, it, expect, vi } from "vitest";
import { applyStatusChange, type StatusDeps } from "@/lib/admin/registrations";

const reg = {
  first_name: "Aino",
  last_name: "Virtanen",
  email: "aino@example.com",
  experience: "beginner",
  registration_date: "2026-11-05T10:00:00Z",
};

function deps(over: Partial<StatusDeps> = {}): StatusDeps {
  return {
    update: vi.fn(async () => reg),
    sendPayment: vi.fn(async () => {}),
    sendRegistration: vi.fn(async () => {}),
    ...over,
  };
}

describe("applyStatusChange", () => {
  it("paid → payment confirmation once", async () => {
    const d = deps();
    await applyStatusChange("r1", "paid", d);
    expect(d.update).toHaveBeenCalledWith("r1", "paid");
    expect(d.sendPayment).toHaveBeenCalledTimes(1);
    expect(d.sendPayment).toHaveBeenCalledWith(expect.objectContaining({ email: "aino@example.com", firstName: "Aino" }));
    expect(d.sendRegistration).not.toHaveBeenCalled();
  });
  it("pending → registration confirmation (promoted from waiting list)", async () => {
    const d = deps();
    await applyStatusChange("r1", "pending", d);
    expect(d.sendRegistration).toHaveBeenCalledWith(expect.objectContaining({ waitingListStatus: "none" }));
    expect(d.sendPayment).not.toHaveBeenCalled();
  });
  it("cancelled → no email", async () => {
    const d = deps();
    await applyStatusChange("r1", "cancelled", d);
    expect(d.sendPayment).not.toHaveBeenCalled();
    expect(d.sendRegistration).not.toHaveBeenCalled();
  });
  it("rejects unknown statuses and missing registrations", async () => {
    await expect(applyStatusChange("r1", "free" as never, deps())).rejects.toThrow("Invalid status");
    await expect(applyStatusChange("r1", "paid", deps({ update: vi.fn(async () => null) }))).rejects.toThrow(
      "Registration not found",
    );
  });
  it("a failing email does not fail the status change", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const d = deps({ sendPayment: vi.fn(async () => Promise.reject(new Error("smtp"))) });
    await expect(applyStatusChange("r1", "paid", d)).resolves.toBeUndefined();
    errSpy.mockRestore();
  });
});
