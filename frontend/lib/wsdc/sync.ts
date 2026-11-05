import { parseWsdcHtml, urlHost, type WsdcEvent } from "@/lib/wsdc/parse";
import { EUROPE_ISO3 } from "@/lib/europe";

export type DanceEventRow = {
  id: string;
  slug: string;
  name: string;
  url: string | null;
  event_type: string | null;
  location: string | null;
  country_code: string | null;
  start_date: string;
  end_date: string;
  source: "wsdc" | "user";
  wsdc_key: string | null;
};

export const DANCE_EVENT_COLUMNS =
  "id, slug, name, url, event_type, location, country_code, start_date, end_date, source, wsdc_key";

export type SyncDeps = {
  fetchHtml: () => Promise<string>;
  loadExisting: () => Promise<DanceEventRow[]>;
  save: (rows: DanceEventRow[]) => Promise<void>;
  purge: () => Promise<number>;
};

const RENAME_WINDOW_DAYS = 60;
const daysBetween = (a: string, b: string) =>
  Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;

/**
 * Finds the stored event an incoming WSDC event corresponds to:
 * 1. same wsdc_key (same name + year; covers date corrections), else
 * 2. the only WSDC event on the same website host starting within 60 days (covers renames).
 */
export function matchExisting(incoming: DanceEventRow, existing: DanceEventRow[]): DanceEventRow | null {
  const byKey = existing.find((e) => e.wsdc_key && e.wsdc_key === incoming.wsdc_key);
  if (byKey) return byKey;

  const host = urlHost(incoming.url);
  if (!host) return null;
  const candidates = existing.filter(
    (e) =>
      e.source === "wsdc" &&
      urlHost(e.url) === host &&
      daysBetween(e.start_date, incoming.start_date) <= RENAME_WINDOW_DAYS,
  );
  return candidates.length === 1 ? candidates[0] : null;
}

function toRow(e: WsdcEvent): DanceEventRow {
  return {
    id: "",
    slug: e.wsdcKey,
    name: e.name,
    url: e.url,
    event_type: e.isTrial ? "Trial Event" : e.eventType || null,
    location: e.location || null,
    country_code: e.countryCode,
    start_date: e.startDate,
    end_date: e.endDate,
    source: "wsdc",
    wsdc_key: e.wsdcKey,
  };
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

/**
 * Pulls the WSDC calendar and upserts European events. Never deletes events that
 * vanished from WSDC (people may be queued); only purge() removes long-past events.
 * Throws before writing anything if the page can't be fetched or parsed.
 */
export async function syncWsdcEvents(deps: SyncDeps): Promise<{ upserted: number; purged: number }> {
  const html = await deps.fetchHtml();
  const parsed = parseWsdcHtml(html);
  if (parsed.length === 0) throw new Error("WSDC parse returned 0 events");

  const seenKeys = new Set<string>();
  const incoming = parsed
    .filter((e) => e.countryCode && EUROPE_ISO3.has(e.countryCode))
    .filter((e) => !seenKeys.has(e.wsdcKey) && seenKeys.add(e.wsdcKey))
    .map(toRow);

  const existing = await deps.loadExisting();
  const takenSlugs = new Set(existing.map((e) => e.slug));
  let pool = [...existing];
  const matched = new Map<DanceEventRow, DanceEventRow>();

  // Pass 1: exact key matches claim their rows before any host-based guessing.
  for (const row of incoming) {
    const hit = pool.find((e) => e.wsdc_key === row.wsdc_key);
    if (hit) {
      matched.set(row, hit);
      pool = pool.filter((e) => e !== hit);
    }
  }
  // Pass 2: renames, matched by website host.
  for (const row of incoming) {
    if (matched.has(row)) continue;
    const hit = matchExisting(row, pool);
    if (hit) {
      matched.set(row, hit);
      pool = pool.filter((e) => e !== hit);
    }
  }

  const rows = incoming.map((row) => {
    const hit = matched.get(row);
    if (hit) return { ...row, id: hit.id, slug: hit.slug };
    return { ...row, id: crypto.randomUUID(), slug: uniqueSlug(row.slug, takenSlugs) };
  });

  await deps.save(rows);
  const purged = await deps.purge();
  return { upserted: rows.length, purged };
}
