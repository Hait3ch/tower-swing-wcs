import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import EventCard, { type EventListItem } from "@/components/partners/EventCard";
import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/partners/events";
import { iso3ToName } from "@/lib/europe";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export const metadata = {
  title: "Find a dance partner – Tower Swing",
  description: "Queue for a registration partner for European West Coast Swing events.",
};

type Search = { country?: string; month?: string; q?: string };

const monthLabel = (ym: string) =>
  new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function PartnersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { country = "", month = "", q = "" } = await searchParams;
  const supabase = await createClient();
  const today = todayIso();

  const [{ data: all }, { data: counts }] = await Promise.all([
    supabase
      .from("dance_events")
      .select("id, slug, name, location, country_code, start_date, end_date, event_type, source")
      .gte("end_date", today)
      .order("start_date")
      .order("name")
      .limit(1000),
    supabase.from("event_queue_counts").select("event_id, leaders, followers, matched"),
  ]);
  const events = (all ?? []) as EventListItem[];
  const countBy = new Map((counts ?? []).map((c) => [c.event_id, c]));

  const countries = [...new Set(events.map((e) => e.country_code).filter((c): c is string => !!c))]
    .map((code) => ({ code, name: iso3ToName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const months = [...new Set(events.map((e) => e.start_date.slice(0, 7)))];

  const needle = q.trim().toLowerCase();
  const looking = (id: string) => (countBy.get(id)?.leaders ?? 0) + (countBy.get(id)?.followers ?? 0);
  // Events with people waiting first (most first), then ones with matches; date order otherwise (stable sort).
  const rank = (id: string) => looking(id) * 1000 + (countBy.get(id)?.matched ?? 0);
  const shown = events.filter(
    (e) =>
      (!country || e.country_code === country) &&
      (!month || e.start_date.slice(0, 7) === month) &&
      (!needle || e.name.toLowerCase().includes(needle) || (e.location ?? "").toLowerCase().includes(needle)),
  ).sort((a, b) => rank(b.id) - rank(a.id));

  const select = "rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900";

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className={`text-4xl sm:text-5xl font-bold text-blue-900 ${dancingScript.className}`}>Find a partner</h1>
          <p className="mt-3 text-gray-700 max-w-2xl">
            Looking for a registration partner? Join the queue for your event. Everyone can see who has waited
            longest, and leaders and followers can reach out to each other.
          </p>

          <form className="mt-6 flex flex-wrap gap-2 items-center" action="/partners">
            <input name="q" defaultValue={q} placeholder="Search events" className={`${select} flex-1 min-w-40`} />
            <select name="country" defaultValue={country} className={select} aria-label="Country">
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="month" defaultValue={month} className={select} aria-label="Month">
              <option value="">Any month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <button className="px-5 py-2 rounded-full bg-blue-700 text-white font-bold">Filter</button>
            {(q || country || month) && (
              <Link href="/partners" className="px-3 py-2 text-gray-600 underline">
                Clear
              </Link>
            )}
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {shown.length} upcoming event{shown.length === 1 ? "" : "s"} · European events from the WSDC calendar,
              plus events added by dancers
            </p>
            <Link href="/partners/new" className="text-sm font-bold text-blue-700 hover:underline">
              + Event missing? Add it
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {shown.map((e) => (
              <EventCard key={e.id} event={e} leaders={countBy.get(e.id)?.leaders ?? 0} followers={countBy.get(e.id)?.followers ?? 0} matched={countBy.get(e.id)?.matched ?? 0} />
            ))}
          </div>
          {shown.length === 0 && (
            <p className="mt-10 text-center text-gray-500">
              No events match. <Link href="/partners/new" className="text-blue-700 underline">Add one</Link>
            </p>
          )}
        </div>
      </main>
    </>
  );
}
