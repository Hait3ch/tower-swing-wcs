"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateProfile, safeNext, type Profile } from "@/lib/profile";

export type ProfileState = { error?: string; saved?: boolean };

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("user_id, display_name, phone, whatsapp_username").eq("user_id", user.id).maybeSingle();
  return data;
}

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  const result = validateProfile({
    display_name: String(formData.get("display_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    whatsapp_username: String(formData.get("whatsapp_username") ?? ""),
    phone_ok: formData.get("phone_ok") === "on",
  });
  if (!result.ok) return { error: result.error };

  const { error } = await supabase.from("profiles").upsert({ user_id: user.id, ...result.value });
  if (error) {
    console.error("saveProfile failed:", error.message);
    return { error: "Could not save your profile. Please try again." };
  }
  revalidatePath("/", "layout");

  const next = formData.get("next");
  if (next) redirect(safeNext(String(next)));
  return { saved: true };
}
