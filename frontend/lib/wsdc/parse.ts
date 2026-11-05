import { countryNameToIso3 } from "@/lib/europe";

export type WsdcEvent = {
  wsdcKey: string;
  name: string;
  url: string | null;
  eventType: string;
  location: string;
  countryCode: string | null;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  isTrial: boolean;
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function month(name: string): number {
  const m = MONTHS[name.slice(0, 3).toLowerCase()];
  if (!m) throw new Error(`Unknown month: ${name}`);
  return m;
}

/**
 * Parses the WSDC date column. Formats seen on the page:
 *   "Feb 25 - 28, 2027" · "Feb 25 - Mar 1, 2027" · "Dec 31 2026 - Jan 2 2027" · "Mar 5, 2027"
 * When only the end year is given and the range wraps past December, the start is the previous year.
 */
export function parseDateRange(text: string): { start: string; end: string } {
  const t = text.replace(/\s+/g, " ").trim();
  let m: RegExpMatchArray | null;

  // Dec 31 2026 - Jan 2 2027
  if ((m = t.match(/^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4}) - ([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/))) {
    return { start: iso(+m[3], month(m[1]), +m[2]), end: iso(+m[6], month(m[4]), +m[5]) };
  }
  // Feb 25 - Mar 1, 2027
  if ((m = t.match(/^([A-Za-z]{3,9})\.? (\d{1,2}) - ([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/))) {
    const sm = month(m[1]), em = month(m[3]), year = +m[5];
    return { start: iso(sm > em ? year - 1 : year, sm, +m[2]), end: iso(year, em, +m[4]) };
  }
  // Feb 25 - 28, 2027
  if ((m = t.match(/^([A-Za-z]{3,9})\.? (\d{1,2}) - (\d{1,2}),? (\d{4})$/))) {
    const mo = month(m[1]);
    return { start: iso(+m[4], mo, +m[2]), end: iso(+m[4], mo, +m[3]) };
  }
  // Mar 5, 2027
  if ((m = t.match(/^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/))) {
    const d = iso(+m[3], month(m[1]), +m[2]);
    return { start: d, end: d };
  }
  throw new Error(`Unrecognised date range: "${text}"`);
}

/** Cleans up URLs typed into the WSDC registry ("http://Https://x.com", "www.x.com", ""). */
export function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  // Keep only the last scheme when several were stacked ("http://Https://…").
  const schemes = [...s.matchAll(/https?:\/\//gi)];
  if (schemes.length > 1) s = s.slice(schemes[schemes.length - 1].index);
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  s = s.replace(/^https?:\/\//i, (x) => x.toLowerCase());
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    return u.pathname === "/" && !u.search && !u.hash && !s.endsWith("/") ? u.origin : u.href;
  } catch {
    return null;
  }
}

/** Host without "www.", used to recognise the same event across renames. */
export function urlHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

const text = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

const ROW = /<tr class="([^"]*)">\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;

/** Extracts every event row from https://worldsdc.com/events/. Rows that cannot be parsed are skipped. */
export function parseWsdcHtml(html: string): WsdcEvent[] {
  const events: WsdcEvent[] = [];
  for (const [, cls, dateCell, nameCell, locCell, flagCell] of html.matchAll(ROW)) {
    const nameMatch = nameCell.match(/class="event_name">\s*(?:<a[^>]*href="([^"]*)"[^>]*>)?([\s\S]*?)(?:<\/a>)?\s*<\/div>/);
    if (!nameMatch) continue;
    const name = text(nameMatch[2]);
    if (!name) continue;

    let dates: { start: string; end: string };
    try {
      dates = parseDateRange(text(dateCell));
    } catch {
      continue;
    }

    const location = text(locCell).replace(/\s*,\s*/g, ", ");
    const flag = flagCell.match(/\?country=([^"&]*)/)?.[1] ?? "";
    const lastPart = location.split(/[,/]/).pop() ?? "";
    const countryCode = /^[A-Z]{3}$/.test(flag) ? flag : countryNameToIso3(lastPart);

    events.push({
      wsdcKey: `${slugify(name)}-${dates.start.slice(0, 4)}`,
      name,
      url: normalizeUrl(decodeEntities(nameMatch[1] ?? "")),
      eventType: text(nameCell.match(/class="event_type">([\s\S]*?)<\/div>/)?.[1] ?? ""),
      location,
      countryCode,
      startDate: dates.start,
      endDate: dates.end,
      isTrial: /\bevent-trial\b/.test(cls),
    });
  }
  return events;
}
