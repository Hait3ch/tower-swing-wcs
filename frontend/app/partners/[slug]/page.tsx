import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import QueueList from "@/components/partners/QueueList";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, todayIso } from "@/lib/partners/events";
import { numberQueue, type QueueRow } from "@/lib/partners/queue";
import { iso3ToFlag, iso3ToName } from "@/lib/europe";
import { leaveQueue, markMatched } from "../actions";
import JoinForm from "./JoinForm";

type Params = { params: Promise<{ slug: string }> };

async function loadEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dance_events")
    .select("id, slug, name, url, location, country_code, start_date, end_date, event_type, source")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, event: data };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await loadEvent(slug);
  if (!event) return { title: "Event not found – Tower Swing" };
  const when = formatDateRange(event.start_date, event.end_date);
  return {
    title: `Find a partner – ${event.name}`,
    description: `${when}${event.location ? ` · ${event.location}` : ""}. See who is looking for a registration partner and join the queue.`,
  };
}

export default async function EventQueuePage({ params }: Params) {
  const { slug } = await params;
  const { supabase, event } = await loadEvent(slug);
  if (!event) notFound();

  const [{ data: rows }, { data: auth }] = await Promise.all([
    supabase.from("partner_queue").select("*").eq("event_id", event.id),
    supabase.auth.getUser(),
  ]);
  const user = auth.user;
  const queue = numberQueue((rows ?? []) as QueueRow[]);
  const followers = queue.filter((r) => r.role === "follower");
  const leaders = queue.filter((r) => r.role === "leader");
  const mine = user ? queue.find((r) => r.user_id === user.id) : undefined;
  const isOver = event.end_date < todayIso();

  // Contact details are only readable by signed-in users (profiles RLS).
  const contacts = new Map<string, { phone: string | null; username: string | null }>();
  if (user && queue.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, phone, whatsapp_username")
      .in("user_id", queue.map((r) => r.user_id));
    for (const p of profiles ?? []) contacts.set(p.user_id, { phone: p.phone, username: p.whatsapp_username });
  }

  const country = event.country_code ? iso3ToName(event.country_code) : null;
  const place = [event.location, country && !event.location?.toLowerCase().endsWith(country.toLowerCase()) ? country : null]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/partners" className="text-sm text-blue-700 hover:underline">
            ← All events
          </Link>
          <div className="mt-3">
            <p className="font-semibold text-purple-700">{formatDateRange(event.start_date, event.end_date)}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 break-words">{event.name}</h1>
            <p className="mt-1 text-gray-600">
              {event.country_code && <span className="mr-1">{iso3ToFlag(event.country_code)}</span>}
              {place}
              {event.event_type === "Trial Event" && " · WSDC Trial"}
              {event.source === "user" && " · Added by community"}
            </p>
            {event.url && (
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-700 font-bold hover:underline">
                Event website ↗
              </a>
            )}
          </div>

          <p className="mt-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900 text-sm">
            Queue numbers show who has waited longest. Leaders and followers are free to choose, but please be fair and
            check the list first.
          </p>

          <div className="mt-6 rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            {isOver ? (
              <p className="text-gray-600">This event is over. The queue is closed.</p>
            ) : mine ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="flex-1 text-blue-900">
                  You&apos;re <strong className="text-2xl">#{mine.position}</strong> in the{" "}
                  {mine.role === "follower" ? "follower" : "leader"} queue.
                </p>
                <form action={markMatched}>
                  <input type="hidden" name="entry_id" value={mine.id} />
                  <input type="hidden" name="slug" value={event.slug} />
                  <button className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-green-600 text-white font-bold hover:bg-green-700">
                    Found a partner 🎉
                  </button>
                </form>
                <form action={leaveQueue}>
                  <input type="hidden" name="entry_id" value={mine.id} />
                  <input type="hidden" name="slug" value={event.slug} />
                  <button className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">
                    Leave queue
                  </button>
                </form>
              </div>
            ) : user ? (
              <>
                <h2 className="text-lg font-bold text-blue-900 mb-3">Looking for a partner for this event?</h2>
                <JoinForm eventId={event.id} slug={event.slug} />
              </>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="flex-1 text-gray-700">Looking for a partner for this event? Sign in to join the queue.</p>
                <Link
                  href={`/auth/login?next=/partners/${event.slug}`}
                  className="text-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg"
                >
                  Sign in to join
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <QueueList
              title="Followers looking for a leader"
              emptyText="No followers waiting yet."
              rows={followers}
              contacts={contacts}
              eventName={event.name}
              currentUserId={user?.id ?? null}
              signedIn={!!user}
            />
            <QueueList
              title="Leaders looking for a follower"
              emptyText="No leaders waiting yet."
              rows={leaders}
              contacts={contacts}
              eventName={event.name}
              currentUserId={user?.id ?? null}
              signedIn={!!user}
            />
          </div>
        </div>
      </main>
    </>
  );
}
