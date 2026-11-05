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

export type JoinState = { error?: string };

export async function joinQueue(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const slug = String(formData.get("slug") ?? "");
  const { supabase, user } = await requireProfile(`/partners/${slug}`);
  const eventId = String(formData.get("event_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;
  if (role !== "leader" && role !== "follower") return { error: "Please choose leader or follower." };

  const { data: event } = await supabase.from("dance_events").select("end_date").eq("id", eventId).maybeSingle();
  if (!event) return { error: "This event no longer exists." };
  if (event.end_date < todayIso()) return { error: "This event is already over." };

  const { error } = await supabase.from("partner_entries").insert({ event_id: eventId, user_id: user.id, role, note });
  if (error) {
    if (error.code === "23505") return { error: "You are already in this queue." };
    console.error("joinQueue failed:", error.message);
    return { error: "Could not join the queue. Please try again." };
  }
  revalidatePath(`/partners/${slug}`);
  revalidatePath("/partners");
  return {};
}

async function closeEntry(formData: FormData, status: "matched" | "withdrawn") {
  const slug = String(formData.get("slug") ?? "");
  const entryId = String(formData.get("entry_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/partners/${slug}`);
  // RLS limits this to the caller's own entries.
  const { error } = await supabase
    .from("partner_entries")
    .update({ status })
    .eq("id", entryId)
    .eq("user_id", user.id)
    .eq("status", "looking");
  if (error) console.error(`closeEntry(${status}) failed:`, error.message);
  revalidatePath(`/partners/${slug}`);
  revalidatePath("/partners");
}

export async function leaveQueue(formData: FormData) {
  await closeEntry(formData, "withdrawn");
}

export async function markMatched(formData: FormData) {
  await closeEntry(formData, "matched");
}
