import { normalizeUrl, slugify, urlHost } from "@/lib/wsdc/parse";
import { iso3ToName } from "@/lib/europe";

export type NewEventInput = {
  name: string;
  url: string;
  start_date: string;
  end_date: string;
  location: string;
  country_code: string;
};

export type NewEventRow = {
  name: string;
  url: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  country_code: string | null;
  source: "user";
  slug: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (d: string) => ISO_DATE.test(d) && !Number.isNaN(Date.parse(d));

/** Today in Finland (yyyy-mm-dd); the community lives there, so "past" follows Helsinki time. */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date());
}

export function validateNewEvent(
  input: NewEventInput,
  today: string,
): { ok: true; row: NewEventRow } | { ok: false; error: string } {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Please enter the event name." };
  if (name.length > 150) return { ok: false, error: "Event name can be at most 150 characters." };
  if (!validDate(input.start_date) || !validDate(input.end_date)) {
    return { ok: false, error: "Please enter valid start and end dates." };
  }
  if (input.end_date < input.start_date) return { ok: false, error: "The event can't end before it starts." };
  if (input.end_date < today) return { ok: false, error: "This event is already over." };

  const country = input.country_code.trim().toUpperCase();
  if (country && iso3ToName(country) === country) return { ok: false, error: "Please pick a country from the list." };

  const rawUrl = input.url.trim();
  const url = rawUrl ? normalizeUrl(rawUrl) : null;
  if (rawUrl && !url) return { ok: false, error: "That website address doesn't look right." };

  return {
    ok: true,
    row: {
      name,
      url,
      start_date: input.start_date,
      end_date: input.end_date,
      location: input.location.trim().slice(0, 150) || null,
      country_code: country || null,
      source: "user",
      slug: `${slugify(name)}-${input.start_date}`,
    },
  };
}

type DatedEvent = { slug?: string; url: string | null; start_date: string; end_date: string };

/** Slug of an existing event on the same website whose dates overlap, else null. */
export function findDuplicate(candidate: DatedEvent, existing: DatedEvent[]): string | null {
  const host = urlHost(candidate.url);
  if (!host) return null;
  const hit = existing.find(
    (e) => urlHost(e.url) === host && e.start_date <= candidate.end_date && candidate.start_date <= e.end_date,
  );
  return hit?.slug ?? null;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Feb 26 – 28, 2027", "Feb 26 – Mar 1, 2027", "Dec 30, 2026 – Jan 2, 2027", "Mar 5, 2027". */
export function formatDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  if (start === end) return `${MONTH[sm - 1]} ${sd}, ${sy}`;
  if (sy !== ey) return `${MONTH[sm - 1]} ${sd}, ${sy} – ${MONTH[em - 1]} ${ed}, ${ey}`;
  if (sm !== em) return `${MONTH[sm - 1]} ${sd} – ${MONTH[em - 1]} ${ed}, ${ey}`;
  return `${MONTH[sm - 1]} ${sd} – ${ed}, ${ey}`;
}
