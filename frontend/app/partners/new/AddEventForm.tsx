"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addEvent, type AddEventState } from "../actions";
import { EUROPE_OPTIONS } from "@/lib/europe";

const input = "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-gray-700 font-semibold mb-1";

export default function AddEventForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<AddEventState, FormData>(addEvent, {});
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className={label}>Event name *</span>
        <input name="name" required maxLength={150} className={input} placeholder="e.g. Westie Gala 2026" />
      </label>
      <label className="block">
        <span className={label}>Website or Facebook event</span>
        <input name="url" className={input} placeholder="https://…" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Starts *</span>
          <input name="start_date" type="date" required className={input} />
        </label>
        <label className="block">
          <span className={label}>Ends *</span>
          <input name="end_date" type="date" required min={today} className={input} />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>City</span>
          <input name="location" maxLength={150} className={input} placeholder="Helsinki" />
        </label>
        <label className="block">
          <span className={label}>Country</span>
          <select name="country_code" defaultValue="FIN" className={input}>
            {EUROPE_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
            <option value="">Outside Europe</option>
          </select>
        </label>
      </div>
      {state.error && (
        <p className="text-red-600">
          {state.error}{" "}
          {state.slug && (
            <Link href={`/partners/${state.slug}`} className="underline font-bold">
              Go to its queue →
            </Link>
          )}
        </p>
      )}
      <button
        disabled={pending}
        className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add event"}
      </button>
    </form>
  );
}
