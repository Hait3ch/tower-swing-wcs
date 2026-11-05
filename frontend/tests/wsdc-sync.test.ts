import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { syncWsdcEvents, matchExisting, type DanceEventRow } from "@/lib/wsdc/sync";
import { EUROPE_ISO3 } from "@/lib/europe";

const html = readFileSync(path.join(__dirname, "fixtures/wsdc-events.html"), "utf8");

function row(over: Partial<DanceEventRow>): DanceEventRow {
  return {
    id: "id-" + Math.random(),
    slug: "s",
    name: "Event",
    url: "https://fest.example.com",
    event_type: "Registry Event",
    location: "Helsinki, Finland",
    country_code: "FIN",
    start_date: "2027-03-10",
    end_date: "2027-03-12",
    source: "wsdc",
    wsdc_key: "event-2027",
    ...over,
  };
}

function deps(over: Partial<Parameters<typeof syncWsdcEvents>[0]> = {}) {
  const saved: DanceEventRow[][] = [];
  const d = {
    fetchHtml: vi.fn(async () => html),
    loadExisting: vi.fn(async (): Promise<DanceEventRow[]> => []),
    save: vi.fn(async (rows: DanceEventRow[]) => {
      saved.push(rows);
    }),
    purge: vi.fn(async () => 2),
    ...over,
  };
  return { d, saved };
}

describe("syncWsdcEvents", () => {
  it("saves only European events, including Winter Coast Swing, and purges", async () => {
    const { d, saved } = deps();
    const res = await syncWsdcEvents(d);
    const rows = saved.flat();
    expect(rows.length).toBe(res.upserted);
    expect(rows.length).toBeGreaterThan(50);
    expect(rows.every((r) => r.country_code && EUROPE_ISO3.has(r.country_code))).toBe(true);
    expect(rows.some((r) => r.country_code === "RUS")).toBe(false);
    expect(rows.find((r) => r.name === "Winter Coast Swing")).toMatchObject({
      slug: "winter-coast-swing-2027",
      wsdc_key: "winter-coast-swing-2027",
      source: "wsdc",
      start_date: "2027-02-25",
    });
    expect(rows.find((r) => r.name === "Swiss Open WCS")?.event_type).toBe("Trial Event");
    expect(res.purged).toBe(2);
  });

  it("aborts without writing when the fetch fails", async () => {
    const { d } = deps({ fetchHtml: vi.fn(async () => Promise.reject(new Error("503"))) });
    await expect(syncWsdcEvents(d)).rejects.toThrow("503");
    expect(d.save).not.toHaveBeenCalled();
    expect(d.purge).not.toHaveBeenCalled();
  });

  it("aborts without writing when the page has no events", async () => {
    const { d } = deps({ fetchHtml: vi.fn(async () => "<html></html>") });
    await expect(syncWsdcEvents(d)).rejects.toThrow("WSDC parse returned 0 events");
    expect(d.save).not.toHaveBeenCalled();
    expect(d.purge).not.toHaveBeenCalled();
  });

  it("updates an existing event in place when WSDC changes its dates", async () => {
    const existing = row({
      id: "keep-me",
      slug: "winter-coast-swing-2027",
      name: "Winter Coast Swing",
      url: "https://www.wintercoastswing.com",
      wsdc_key: "winter-coast-swing-2027",
      start_date: "2027-02-20",
      end_date: "2027-02-22",
    });
    const { d, saved } = deps({ loadExisting: vi.fn(async () => [existing]) });
    await syncWsdcEvents(d);
    const matches = saved.flat().filter((r) => r.name === "Winter Coast Swing");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ id: "keep-me", slug: "winter-coast-swing-2027", start_date: "2027-02-25" });
  });

  it("updates an existing event in place when WSDC renames it", async () => {
    const existing = row({
      id: "renamed",
      slug: "winter-coast-2027",
      name: "Winter Coast",
      url: "https://wintercoastswing.com",
      wsdc_key: "winter-coast-2027",
      start_date: "2027-02-25",
      end_date: "2027-02-28",
    });
    const { d, saved } = deps({ loadExisting: vi.fn(async () => [existing]) });
    await syncWsdcEvents(d);
    const r = saved.flat().find((x) => x.id === "renamed");
    expect(r).toMatchObject({ name: "Winter Coast Swing", slug: "winter-coast-2027", wsdc_key: "winter-coast-swing-2027" });
    expect(saved.flat().filter((x) => x.name === "Winter Coast Swing")).toHaveLength(1);
  });

  it("gives a new event a unique slug when its key-slug is already taken", async () => {
    const userEvent = row({ id: "u", slug: "winter-coast-swing-2027", source: "user", wsdc_key: null, url: null });
    const { d, saved } = deps({ loadExisting: vi.fn(async () => [userEvent]) });
    await syncWsdcEvents(d);
    const r = saved.flat().find((x) => x.name === "Winter Coast Swing");
    expect(r?.id).not.toBe("u");
    expect(r?.slug).toBe("winter-coast-swing-2027-2");
  });
});

describe("syncWsdcEvents safety (review fixes)", () => {
  const today = "2026-11-05";

  it("never adopts a user-added row, even with a matching key", async () => {
    const userRow = row({ id: "u", slug: "user-slug", source: "user", wsdc_key: "winter-coast-swing-2027", url: null });
    const { d, saved } = deps({ loadExisting: vi.fn(async () => [userRow]), today });
    await syncWsdcEvents(d);
    const r = saved.flat().find((x) => x.name === "Winter Coast Swing");
    expect(r?.id).not.toBe("u");
  });

  it("does not hand an ended event's queue to a new event on the same website", async () => {
    // "X Spring" ended last week but is still stored; WSDC now lists "X Summer" on the same host.
    const ended = row({
      id: "spring",
      slug: "x-spring-2026",
      name: "X Spring",
      url: "https://x-fest.example.com",
      wsdc_key: "x-spring-2026",
      start_date: "2026-10-27",
      end_date: "2026-10-29",
    });
    const summerHtml = `<tr class="  "><td>Dec 4 - 6, 2026</td><td><div class="event_name"><a href="https://x-fest.example.com" TARGET="_blank">X Summer</a></div><div class="event_type">Registry Event</div></td><td>Helsinki, Finland</td><td><a href="?country=FIN" border="0"></a></td></tr>`;
    const { d, saved } = deps({ fetchHtml: vi.fn(async () => summerHtml), loadExisting: vi.fn(async () => [ended]), today });
    await syncWsdcEvents(d);
    const r = saved.flat().find((x) => x.name === "X Summer");
    expect(r?.id).not.toBe("spring");
  });

  it("does not guess when two incoming events share the old event's website", async () => {
    const old = row({
      id: "old",
      slug: "x-fest-2027",
      name: "X Fest",
      url: "https://x-fest.example.com",
      wsdc_key: "x-fest-2027",
      start_date: "2027-03-10",
      end_date: "2027-03-12",
    });
    const tr = (name: string, dates: string) =>
      `<tr class="  "><td>${dates}</td><td><div class="event_name"><a href="https://x-fest.example.com" TARGET="_blank">${name}</a></div><div class="event_type">Registry Event</div></td><td>Helsinki, Finland</td><td><a href="?country=FIN" border="0"></a></td></tr>`;
    const html = tr("X Fest Renamed", "Mar 10 - 12, 2027") + tr("X Fest Newcomer", "Mar 20 - 22, 2027");
    const { d, saved } = deps({ fetchHtml: vi.fn(async () => html), loadExisting: vi.fn(async () => [old]), today });
    await syncWsdcEvents(d);
    expect(saved.flat().filter((x) => x.id === "old")).toHaveLength(0);
    expect(saved.flat()).toHaveLength(2);
  });
});

describe("matchExisting", () => {
  const incoming = row({ name: "Fest New Name", wsdc_key: "fest-new-name-2027", start_date: "2027-03-20" });

  it("matches by wsdc_key first", () => {
    const a = row({ id: "a", wsdc_key: "fest-new-name-2027", url: "https://other.example.com" });
    expect(matchExisting(incoming, [a])?.id).toBe("a");
  });

  it("matches a rename by URL host within 60 days", () => {
    const a = row({ id: "a", wsdc_key: "fest-old-name-2027", url: "https://www.fest.example.com/" });
    expect(matchExisting(incoming, [a])?.id).toBe("a");
  });

  it("does not guess when two existing events share the host", () => {
    const a = row({ id: "a", wsdc_key: "x-2027" });
    const b = row({ id: "b", wsdc_key: "y-2027", start_date: "2027-03-25" });
    expect(matchExisting(incoming, [a, b])).toBeNull();
  });

  it("does not match next year's edition on the same host", () => {
    const a = row({ id: "a", wsdc_key: "fest-2026", start_date: "2026-09-01" });
    expect(matchExisting(incoming, [a])).toBeNull();
  });

  it("never matches user-added events by host", () => {
    const a = row({ id: "a", source: "user", wsdc_key: null });
    expect(matchExisting(incoming, [a])).toBeNull();
  });
});

describe("GET /api/cron/sync-wsdc", () => {
  it("rejects requests without the cron secret", async () => {
    process.env.CRON_SECRET = "s3cret";
    const { GET } = await import("@/app/api/cron/sync-wsdc/route");
    const res = await GET(new Request("http://localhost/api/cron/sync-wsdc"));
    expect(res.status).toBe(401);
    const wrong = await GET(
      new Request("http://localhost/api/cron/sync-wsdc", { headers: { authorization: "Bearer nope" } }),
    );
    expect(wrong.status).toBe(401);
  });
});
