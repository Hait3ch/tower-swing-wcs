import Link from "next/link";
import { requireAdmin, deleteDanceEvent, deletePartnerEntry } from "../../actions";
import { formatDateRange, todayIso } from "@/lib/partners/events";
import { numberQueue, type QueueRow } from "@/lib/partners/queue";

export const metadata = { title: "Partner queue admin – Tower Swing" };

export default async function AdminPartnersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await requireAdmin();
  const { q = "" } = await searchParams;

  const [{ data: events }, { data: entries }, { data: profiles }] = await Promise.all([
    supabase
      .from("dance_events")
      .select("id, slug, name, start_date, end_date, source, created_by, country_code")
      .gte("end_date", todayIso())
      .order("start_date"),
    supabase.from("partner_queue").select("*"),
    supabase.from("profiles").select("user_id, display_name"),
  ]);
  const names = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
  const queue = numberQueue((entries ?? []) as QueueRow[]);
  const byEvent = new Map<string, typeof queue>();
  for (const e of queue) byEvent.set(e.event_id, [...(byEvent.get(e.event_id) ?? []), e]);

  const needle = q.trim().toLowerCase();
  const shown = (events ?? []).filter(
    (e) => (needle ? e.name.toLowerCase().includes(needle) : e.source === "user" || byEvent.has(e.id)),
  );

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <Link href="/admin/dashboard" className="px-3 py-2 text-gray-500 hover:text-gray-700 font-medium">
              Registrations
            </Link>
            <Link href="/admin/events" className="px-3 py-2 text-gray-500 hover:text-gray-700 font-medium">
              Events
            </Link>
            <Link href="/admin/partners" className="px-3 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">
              Partner queue
            </Link>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Partner queue</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Shows community-added events and events with people in the queue. Search to find any event, e.g. a cancelled
          WSDC event to remove. Deleting an event also removes its queue.
        </p>
        <form className="mt-4 flex gap-2" action="/admin/partners">
          <input name="q" defaultValue={q} placeholder="Search all upcoming events" className="flex-1 rounded-lg border border-gray-300 px-3 py-2" />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Search</button>
        </form>

        <div className="mt-6 space-y-4">
          {shown.map((e) => {
            const rows = byEvent.get(e.id) ?? [];
            return (
              <section key={e.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/partners/${e.slug}`} className="font-semibold text-blue-800 hover:underline">
                      {e.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {formatDateRange(e.start_date, e.end_date)} · {e.country_code ?? "—"} ·{" "}
                      {e.source === "user" ? `added by ${names.get(e.created_by ?? "") ?? "unknown"}` : "WSDC"} ·{" "}
                      {rows.length} in queue
                    </p>
                  </div>
                  <form action={deleteDanceEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
                      Delete event
                    </button>
                  </form>
                </div>
                {rows.length > 0 && (
                  <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                    {rows.map((r) => (
                      <li key={r.id} className="py-2 flex items-center gap-3 text-sm">
                        <span className="w-24 text-gray-500">
                          {r.role} #{r.position}
                        </span>
                        <span className="flex-1">
                          {r.display_name}
                          {r.note && <span className="text-gray-500"> – {r.note}</span>}
                        </span>
                        <form action={deletePartnerEntry}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="text-red-600 hover:underline">Remove</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
          {shown.length === 0 && <p className="text-gray-500">Nothing to moderate.</p>}
        </div>
      </div>
    </main>
  );
}
