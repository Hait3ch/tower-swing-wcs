import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/profile";

/** Magic-link landing: exchange the code for a session, then send new users to set up their profile. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) return NextResponse.redirect(new URL("/auth/login?error=missing", url.origin));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/auth/login?error=expired", url.origin));

  const { data: profile } = await supabase.from("profiles").select("user_id").eq("user_id", data.user.id).maybeSingle();
  // Admin pages need no dancer profile.
  const target = profile || next.startsWith("/admin") ? next : `/account?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(target, url.origin));
}
