import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseWsdcHtml, parseDateRange, normalizeUrl } from "@/lib/wsdc/parse";
import { EUROPE_ISO3, countryNameToIso3, iso3ToName } from "@/lib/europe";

const html = readFileSync(path.join(__dirname, "fixtures/wsdc-events.html"), "utf8");

describe("parseDateRange", () => {
  it("same month", () => {
    expect(parseDateRange("Feb 25 - 28, 2027")).toEqual({ start: "2027-02-25", end: "2027-02-28" });
  });
  it("crosses months", () => {
    expect(parseDateRange("Feb 25 - Mar 1, 2027")).toEqual({ start: "2027-02-25", end: "2027-03-01" });
  });
  it("explicit years on both sides", () => {
    expect(parseDateRange("Dec 31 2026 - Jan 2 2027")).toEqual({ start: "2026-12-31", end: "2027-01-02" });
  });
  it("crosses the new year with one year given", () => {
    expect(parseDateRange("Dec 30 - Jan 2, 2027")).toEqual({ start: "2026-12-30", end: "2027-01-02" });
  });
  it("single day", () => {
    expect(parseDateRange("Mar 5, 2027")).toEqual({ start: "2027-03-05", end: "2027-03-05" });
  });
  it("rejects garbage", () => {
    expect(() => parseDateRange("garbage")).toThrow();
  });
});

describe("normalizeUrl", () => {
  it("fixes doubled scheme", () => {
    expect(normalizeUrl("http://Https://parisswingclassic.com")).toBe("https://parisswingclassic.com");
  });
  it("adds https to bare hosts", () => {
    expect(normalizeUrl("www.x.com")).toBe("https://www.x.com");
  });
  it("empty is null", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
  });
  it("keeps valid urls", () => {
    expect(normalizeUrl("https://t.me/honeyfest")).toBe("https://t.me/honeyfest");
  });
});

describe("europe", () => {
  it("contains the right countries", () => {
    expect(EUROPE_ISO3.has("FIN")).toBe(true);
    expect(EUROPE_ISO3.has("USA")).toBe(false);
    expect(EUROPE_ISO3.has("RUS")).toBe(false);
    expect(EUROPE_ISO3.has("TUR")).toBe(false);
  });
  it("maps names seen on the WSDC page", () => {
    expect(countryNameToIso3("Russia")).toBe("RUS");
    expect(countryNameToIso3("Deutschland")).toBe("DEU");
    expect(countryNameToIso3("Nederland")).toBe("NLD");
    expect(countryNameToIso3("US")).toBe("USA");
    expect(countryNameToIso3("United states")).toBe("USA");
    expect(countryNameToIso3("Atlantis")).toBeNull();
    expect(iso3ToName("FIN")).toBe("Finland");
  });
});

describe("parseWsdcHtml", () => {
  const events = parseWsdcHtml(html);

  it("parses the whole page", () => {
    expect(events.length).toBeGreaterThanOrEqual(150);
  });

  it("parses Winter Coast Swing exactly", () => {
    const e = events.find((x) => x.name === "Winter Coast Swing");
    expect(e).toMatchObject({
      countryCode: "FIN",
      location: "Kuopio, Leppävirta, Finland",
      url: "https://www.wintercoastswing.com",
      startDate: "2027-02-25",
      endDate: "2027-02-28",
      eventType: "Registry Event",
      isTrial: false,
      wsdcKey: "winter-coast-swing-2027",
    });
  });

  it("falls back to the location name when the flag code is missing", () => {
    const russian = events.filter((e) => /Russia$/.test(e.location));
    expect(russian.length).toBeGreaterThan(0);
    for (const e of russian) expect(e.countryCode).toBe("RUS");
    expect(events.find((e) => e.name === "New York Flow Festival")?.countryCode).toBe("USA");
  });

  it("flags trial events", () => {
    expect(events.find((e) => e.name === "Swiss Open WCS")?.isTrial).toBe(true);
  });

  it("parses year-spanning dates", () => {
    expect(events.find((e) => e.name === "New Years Swing Fling")).toMatchObject({
      startDate: "2026-12-30",
      endDate: "2027-01-03",
    });
  });

  it("decodes html entities in names", () => {
    expect(events.some((e) => e.name === "Swing & Snow")).toBe(true);
  });

  it("returns [] for a page without event rows", () => {
    expect(parseWsdcHtml("<html></html>")).toEqual([]);
  });
});
