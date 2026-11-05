import Wordmark from "./Wordmark";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/** Header for inner pages: logo, partner finder link, sign-in state. */
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4 text-sm sm:text-base font-bold">
          <Link href="/partners" className="px-3 py-2 rounded-full hover:bg-white/15">
            Find a partner
          </Link>
          {user ? (
            <Link href="/account" className="px-3 py-2 rounded-full border border-white/60 hover:bg-white hover:text-blue-900">
              Account
            </Link>
          ) : (
            <Link href="/auth/login" className="px-3 py-2 rounded-full border border-white/60 hover:bg-white hover:text-blue-900">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
