"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "../actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {});

  if (state.sent) {
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-6 text-blue-900">
        <p className="font-bold text-lg mb-1">Check your email ✉️</p>
        <p>
          We sent a sign-in link to <strong>{state.sent}</strong>. Open it on this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="block text-gray-700 font-semibold mb-1">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </label>
      {state.error && <p className="text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send me a sign-in link"}
      </button>
      <p className="text-sm text-gray-500">No password needed. New here? The same link creates your account.</p>
    </form>
  );
}
