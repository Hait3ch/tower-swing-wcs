import { describe, it, expect } from "vitest";
import { numberQueue, waLink, timeAgo, type QueueRow } from "@/lib/partners/queue";

const r = (id: string, role: "leader" | "follower", created_at: string): QueueRow => ({
  id,
  event_id: "e",
  user_id: "u" + id,
  role,
  note: null,
  created_at,
  display_name: "N" + id,
});

describe("numberQueue", () => {
  it("numbers each role separately by join time", () => {
    const rows = [
      r("3", "follower", "2026-11-03T10:00:00Z"),
      r("1", "follower", "2026-11-01T10:00:00Z"),
      r("2", "leader", "2026-11-02T10:00:00Z"),
      r("4", "leader", "2026-11-01T09:00:00Z"),
    ];
    const out = numberQueue(rows);
    expect(out.filter((x) => x.role === "follower").map((x) => [x.id, x.position])).toEqual([
      ["1", 1],
      ["3", 2],
    ]);
    expect(out.filter((x) => x.role === "leader").map((x) => [x.id, x.position])).toEqual([
      ["4", 1],
      ["2", 2],
    ]);
  });
  it("breaks ties on created_at by id", () => {
    const t = "2026-11-01T10:00:00Z";
    expect(numberQueue([r("b", "follower", t), r("a", "follower", t)]).map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("renumbers without gaps when someone leaves", () => {
    const rows = [r("1", "follower", "2026-11-01T00:00:00Z"), r("3", "follower", "2026-11-03T00:00:00Z")];
    expect(numberQueue(rows).map((x) => x.position)).toEqual([1, 2]);
  });
});

describe("waLink", () => {
  it("builds a wa.me link with a prefilled message", () => {
    expect(waLink("+358 40 123", "Westie Gala")).toBe(
      "https://wa.me/35840123?text=" +
        encodeURIComponent("Hi! I saw you're looking for a partner for Westie Gala on Tower Swing."),
    );
  });
  it("turns a Finnish local number into international format", () => {
    expect(waLink("0401234567", "X").startsWith("https://wa.me/358401234567?")).toBe(true);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  it("is human friendly", () => {
    expect(timeAgo("2026-11-05T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-11-05T11:00:00Z", now)).toBe("1 hour ago");
    expect(timeAgo("2026-11-02T12:00:00Z", now)).toBe("3 days ago");
  });
});
