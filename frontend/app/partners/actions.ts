"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateNewEvent, findDuplicate, todayIso } from "@/lib/partners/events";

export type AddEventState = { error?: string; slug?: string };

async function requireProfile(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect(`/account?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export async function addEvent(_prev: AddEventState, formData: FormData): Promise<AddEventState> {
  const { supabase, user } = await requireProfile("/partners/new");
  const field = (k: string) => String(formData.get(k) ?? "");
  const result = validateNewEvent(
    {
      name: field("name"),
      url: field("url"),
      start_date: field("start_date"),
      end_date: field("end_date"),
      location: field("location"),
      country_code: field("country_code"),
    },
    todayIso(),
  );
  if (!result.ok) return { error: result.error };
  const row = result.row;

  if (row.url) {
    const { data: overlapping } = await supabase
      .from("dance_events")
      .select("slug, url, start_date, end_date")
      .lte("start_date", row.end_date)
      .gte("end_date", row.start_date);
    const dup = findDuplicate(row, overlapping ?? []);
    if (dup) return { error: "This event already exists.", slug: dup };
  }

  let slug = row.slug;
  for (let attempt = 2; attempt < 20; attempt++) {
    const { error } = await supabase.from("dance_events").insert({ ...row, slug, created_by: user.id });
    if (!error) {
      revalidatePath("/partners");
      redirect(`/partners/${slug}`);
    }
    if (error.code !== "23505") {
      console.error("addEvent failed:", error.message);
      return { error: "Could not add the event. Please try again." };
    }
    slug = `${row.slug}-${attempt}`;
  }
  return { error: "Could not add the event. Please try again." };
}
