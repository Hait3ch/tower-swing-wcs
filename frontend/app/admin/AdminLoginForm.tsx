"use client";

import { useActionState } from "react";
import { signInWithPassword, type LoginState } from "../auth/actions";

const input =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signInWithPassword, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value="/admin/dashboard" />
      <label className="block">
        <span className="block text-gray-700 font-semibold mb-1">Email</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block">
        <span className="block text-gray-700 font-semibold mb-1">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      {state.error && <p className="text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
