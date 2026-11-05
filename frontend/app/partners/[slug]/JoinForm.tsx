"use client";

import { useActionState } from "react";
import { joinQueue, type JoinState } from "../actions";

export default function JoinForm({ eventId, slug }: { eventId: string; slug: string }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinQueue, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <fieldset className="grid sm:grid-cols-2 gap-2">
        <legend className="sr-only">I am a</legend>
        <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
          <input type="radio" name="role" value="follower" required />
          <span>
            <strong>Follower</strong> <span className="text-gray-500 text-sm">looking for a leader</span>
          </span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
          <input type="radio" name="role" value="leader" required />
          <span>
            <strong>Leader</strong> <span className="text-gray-500 text-sm">looking for a follower</span>
          </span>
        </label>
      </fieldset>
      <input
        name="note"
        maxLength={200}
        placeholder="Optional note, e.g. “Full pass, Novice level”"
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
      />
      {state.error && <p className="text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join the queue"}
      </button>
    </form>
  );
}
