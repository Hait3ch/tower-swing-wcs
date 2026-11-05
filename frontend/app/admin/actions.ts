"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPaymentConfirmation, sendRegistrationConfirmation } from "@/lib/email";
import { applyStatusChange, type PaymentStatus } from "@/lib/admin/registrations";

/** Redirects to /admin unless the signed-in user's email is in the admins table. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");
  return supabase;
}

export type AdminRegistration = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: "beginner" | "intermediate" | "advanced";
  paymentStatus: PaymentStatus;
  registrationDate: string;
  eventDate: string;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  event?: { _id: string; name: string; year: number; date: string };
};

export type AdminTowerEvent = {
  _id: string;
  year: number;
  name: string;
  date: string;
  maxCapacity: number;
  isActive: boolean;
  registrationOpen: boolean;
  waitingListEnabled: boolean;
  price: number;
  venue: string;
  address: string;
  description?: string;
};

export async function listRegistrations(): Promise<AdminRegistration[]> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("tower_registrations")
    .select("*, event:tower_events(id, name, year, date)")
    .order("registration_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    _id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    experience: r.experience,
    paymentStatus: r.payment_status,
    registrationDate: r.registration_date,
    eventDate: r.event_date,
    price: Number(r.price),
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    event: r.event ? { _id: r.event.id, name: r.event.name, year: r.event.year, date: r.event.date } : undefined,
  }));
}

export async function listTowerEvents(): Promise<AdminTowerEvent[]> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from("tower_events").select("*").order("year", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    _id: e.id,
    year: e.year,
    name: e.name,
    date: e.date,
    maxCapacity: e.max_capacity,
    isActive: e.is_active,
    registrationOpen: e.registration_open,
    waitingListEnabled: e.waiting_list_enabled,
    price: Number(e.price),
    venue: e.venue,
    address: e.address,
    description: e.description ?? undefined,
  }));
}

export async function updateRegistrationStatus(id: string, status: PaymentStatus): Promise<void> {
  const supabase = await requireAdmin();
  await applyStatusChange(id, status, {
    update: async (regId, s) => {
      const { data, error } = await supabase
        .from("tower_registrations")
        .update({ payment_status: s })
        .eq("id", regId)
        .select("first_name, last_name, email, experience, registration_date")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    sendPayment: sendPaymentConfirmation,
    sendRegistration: sendRegistrationConfirmation,
  });
}

export async function deleteRegistration(id: string): Promise<void> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("tower_registrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type TowerEventInput = {
  year: number;
  name: string;
  date: string;
  maxCapacity: number;
  price: number;
  venue: string;
  address: string;
  description: string;
  registrationOpen: boolean;
  waitingListEnabled: boolean;
};

export async function saveTowerEvent(input: TowerEventInput, id?: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin();
  const row = {
    year: Number(input.year),
    name: input.name.trim(),
    date: input.date,
    max_capacity: Number(input.maxCapacity),
    price: Number(input.price),
    venue: input.venue.trim(),
    address: input.address.trim(),
    description: input.description.trim() || null,
    registration_open: input.registrationOpen,
    waiting_list_enabled: input.waitingListEnabled,
  };
  const { error } = id
    ? await supabase.from("tower_events").update(row).eq("id", id)
    : await supabase.from("tower_events").insert(row);
  if (error) return { error: error.code === "23505" ? "An event with this year and name already exists" : error.message };
  return {};
}

export async function activateTowerEvent(id: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("activate_tower_event", { event_id: id });
  return error ? { error: error.message } : {};
}

// ---------- partner queue moderation ----------

export async function deleteDanceEvent(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("dance_events").delete().eq("id", String(formData.get("id")));
  if (error) console.error("deleteDanceEvent failed:", error.message);
  revalidatePath("/admin/partners");
  revalidatePath("/partners");
}

export async function deletePartnerEntry(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("partner_entries").delete().eq("id", String(formData.get("id")));
  if (error) console.error("deletePartnerEntry failed:", error.message);
  revalidatePath("/admin/partners");
}
