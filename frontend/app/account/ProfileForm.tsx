"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

type Props = { displayName: string; phone: string; next?: string };

export default function ProfileForm({ displayName, phone, next }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const input =
    "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block">
        <span className="block text-gray-700 font-semibold mb-1">Name shown in queues</span>
        <input name="display_name" defaultValue={displayName} required maxLength={60} className={input} placeholder="e.g. Mira K." />
      </label>
      <label className="block">
        <span className="block text-gray-700 font-semibold mb-1">WhatsApp number (optional)</span>
        <input name="phone" type="tel" defaultValue={phone} className={input} placeholder="+358 40 123 4567" />
        <span className="block text-sm text-gray-500 mt-1">
          Only signed-in dancers can see it, so a partner can message you directly. Leave empty to stay private.
        </span>
      </label>
      {state.error && <p className="text-red-600">{state.error}</p>}
      {state.saved && <p className="text-green-700">Saved ✓</p>}
      <button
        disabled={pending}
        className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg disabled:opacity-60"
      >
        {pending ? "Saving…" : next ? "Save and continue" : "Save"}
      </button>
    </form>
  );
}
