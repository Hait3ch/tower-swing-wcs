import { describe, it, expect } from "vitest";
import { validateNewEvent, formatDateRange } from "@/lib/partners/events";

const base = {
  name: "Westie Gala",
  url: "westiegala.fi",
  start_date: "2026-12-05",
  end_date: "2026-12-06",
  location: "Helsinki",
  country_code: "FIN",
};
const today = "2026-11-05";

describe("validateNewEvent", () => {
  it("builds a community event row", () => {
    expect(validateNewEvent(base, today)).toEqual({
      ok: true,
      row: {
        name: "Westie Gala",
        url: "https://westiegala.fi",
        start_date: "2026-12-05",
        end_date: "2026-12-06",
        location: "Helsinki",
        country_code: "FIN",
        source: "user",
        slug: "westie-gala-2026-12-05",
      },
    });
  });
  it("rejects end before start", () => {
    expect(validateNewEvent({ ...base, end_date: "2026-12-04" }, today)).toEqual({
      ok: false,
      error: "The event can't end before it starts.",
    });
  });
  it("rejects an empty name", () => {
    expect(validateNewEvent({ ...base, name: "  " }, today).ok).toBe(false);
  });
  it("rejects events that already ended", () => {
    expect(validateNewEvent({ ...base, start_date: "2026-11-01", end_date: "2026-11-02" }, today)).toEqual({
      ok: false,
      error: "This event is already over.",
    });
  });
  it("allows an event that is happening today", () => {
    expect(validateNewEvent({ ...base, start_date: "2026-11-04", end_date: "2026-11-05" }, today).ok).toBe(true);
  });
  it("rejects invalid dates and unknown country codes", () => {
    expect(validateNewEvent({ ...base, start_date: "soon" }, today).ok).toBe(false);
    expect(validateNewEvent({ ...base, country_code: "XXX" }, today).ok).toBe(false);
  });
  it("allows events outside Europe via an empty country", () => {
    const r = validateNewEvent({ ...base, country_code: "" }, today);
    expect(r.ok && r.row.country_code).toBe(null);
  });
  it("allows a missing url", () => {
    const r = validateNewEvent({ ...base, url: "" }, today);
    expect(r.ok && r.row.url).toBe(null);
  });
});

describe("formatDateRange", () => {
  it("formats ranges compactly", () => {
    expect(formatDateRange("2027-02-26", "2027-02-28")).toBe("Feb 26 – 28, 2027");
    expect(formatDateRange("2027-02-26", "2027-03-01")).toBe("Feb 26 – Mar 1, 2027");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("Dec 30, 2026 – Jan 2, 2027");
    expect(formatDateRange("2027-03-05", "2027-03-05")).toBe("Mar 5, 2027");
  });
});

import { findDuplicate } from "@/lib/partners/events";

describe("findDuplicate", () => {
  const existing = [
    { slug: "winter-coast-swing-2027", url: "https://www.wintercoastswing.com", start_date: "2027-02-25", end_date: "2027-02-28" },
    { slug: "no-url", url: null, start_date: "2027-02-25", end_date: "2027-02-28" },
  ];
  it("matches same host with overlapping dates", () => {
    expect(findDuplicate({ url: "https://wintercoastswing.com/tickets", start_date: "2027-02-27", end_date: "2027-03-01" }, existing)).toBe(
      "winter-coast-swing-2027",
    );
  });
  it("ignores the same host on other dates", () => {
    expect(findDuplicate({ url: "https://wintercoastswing.com", start_date: "2028-02-25", end_date: "2028-02-27" }, existing)).toBeNull();
  });
  it("ignores events without urls", () => {
    expect(findDuplicate({ url: null, start_date: "2027-02-25", end_date: "2027-02-28" }, existing)).toBeNull();
  });
});
