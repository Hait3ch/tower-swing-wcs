import { timeAgo, waLink, type QueueRow } from "@/lib/partners/queue";

type Props = {
  title: string;
  emptyText: string;
  rows: Array<QueueRow & { position: number }>;
  contacts: Map<string, { phone: string | null; username: string | null }>;
  eventName: string;
  currentUserId: string | null;
  signedIn: boolean;
};

export default function QueueList({ title, emptyText, rows, contacts, eventName, currentUserId, signedIn }: Props) {
  return (
    <section className="rounded-2xl bg-white border border-gray-200 shadow-sm">
      <h2 className="px-5 pt-4 pb-3 border-b border-gray-100 text-lg font-bold text-blue-900">
        {title} <span className="text-gray-400 font-normal">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-gray-500">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-gray-100">
          {rows.map((r) => {
            const { phone, username } = contacts.get(r.user_id) ?? { phone: null, username: null };
            const mine = r.user_id === currentUserId;
            return (
              <li key={r.id} className={`px-5 py-3 flex items-start gap-3 ${mine ? "bg-blue-50" : ""}`}>
                <span className="shrink-0 w-9 text-right font-bold text-purple-700">#{r.position}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 break-words">
                    {r.display_name} {mine && <span className="text-xs text-blue-700">(you)</span>}
                  </p>
                  {r.note && <p className="text-sm text-gray-600 break-words">“{r.note}”</p>}
                  <p className="text-xs text-gray-400">joined {timeAgo(r.created_at)}</p>
                </div>
                {!mine && username && (
                  <span className="shrink-0 text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-800 font-semibold select-all" title="WhatsApp username">
                    WhatsApp @{username}
                  </span>
                )}
                {!mine && !username && phone && (
                  <a
                    href={waLink(phone, eventName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm px-3 py-1.5 rounded-full bg-green-600 text-white font-bold hover:bg-green-700"
                  >
                    WhatsApp
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {!signedIn && rows.length > 0 && (
        <p className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">Sign in to see contact buttons.</p>
      )}
    </section>
  );
}
