import Link from "next/link";
import { formatDateRange } from "@/lib/partners/events";
import { iso3ToFlag, iso3ToName } from "@/lib/europe";

export type EventListItem = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  country_code: string | null;
  start_date: string;
  end_date: string;
  event_type: string | null;
  source: "wsdc" | "user";
};

type Props = { event: EventListItem; leaders: number; followers: number };

export default function EventCard({ event, leaders, followers }: Props) {
  const country = event.country_code ? iso3ToName(event.country_code) : null;
  return (
    <Link
      href={`/partners/${event.slug}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-purple-700">{formatDateRange(event.start_date, event.end_date)}</p>
          <h2 className="text-lg font-bold text-blue-900 leading-snug break-words">{event.name}</h2>
          <p className="text-gray-600 text-sm mt-1">
            {event.country_code && <span className="mr-1">{iso3ToFlag(event.country_code)}</span>}
            {[event.location, country && !event.location?.toLowerCase().endsWith(country.toLowerCase()) ? country : null].filter(Boolean).join(", ")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.event_type === "Trial Event" && (
              <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">WSDC Trial</span>
            )}
            {event.source === "user" && (
              <span className="text-xs rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">Added by community</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right text-sm leading-6">
          <p className={followers ? "text-blue-900 font-bold" : "text-gray-400"}>{followers} follower{followers === 1 ? "" : "s"}</p>
          <p className={leaders ? "text-blue-900 font-bold" : "text-gray-400"}>{leaders} leader{leaders === 1 ? "" : "s"}</p>
          <p className="text-xs text-gray-400">looking</p>
        </div>
      </div>
    </Link>
  );
}
