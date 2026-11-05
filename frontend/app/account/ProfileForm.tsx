"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

type Props = { displayName: string; phone: string; whatsappUsername: string; next?: string };

export default function ProfileForm({ displayName, phone, whatsappUsername, next }: Props) {
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
        <span className="block text-gray-700 font-semibold mb-1">
          WhatsApp username <span className="text-green-700 text-sm font-normal">recommended</span>
        </span>
        <input name="whatsapp_username" defaultValue={whatsappUsername} maxLength={36} className={input} placeholder="@mira.dances" />
        <span className="block text-sm text-gray-500 mt-1">
          Partners can find you on WhatsApp without seeing your number. Set one in WhatsApp → Settings → Profile.
        </span>
      </label>
      <details className="rounded-lg border border-gray-200 px-4 py-3" open={!!phone}>
        <summary className="cursor-pointer text-gray-700 font-semibold">Or share your phone number instead (optional)</summary>
        <input name="phone" type="tel" defaultValue={phone} className={`${input} mt-3`} placeholder="+358 40 123 4567" />
        <label className="flex items-start gap-2 mt-2 text-sm text-gray-600">
          <input type="checkbox" name="phone_ok" defaultChecked={!!phone} className="mt-1" />
          I agree that signed-in dancers can see my phone number.
        </label>
      </details>
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
