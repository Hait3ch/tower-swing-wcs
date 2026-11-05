"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendRegistrationConfirmation } from "@/lib/email";
import { registerCore, type RegistrationInput, type RegisterResult } from "@/lib/tower/register";

export type ActiveTowerEvent = {
  _id: string;
  year: number;
  name: string;
  date: string;
  maxCapacity: number;
  price: number;
  venue: string;
  address: string;
  description?: string;
  registrationOpen: boolean;
};

export async function getActiveTowerEvent(): Promise<ActiveTowerEvent | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("tower_events").select("*").eq("is_active", true).maybeSingle();
  if (!data) return null;
  return {
    _id: data.id,
    year: data.year,
    name: data.name,
    date: data.date,
    maxCapacity: data.max_capacity,
    price: Number(data.price),
    venue: data.venue,
    address: data.address,
    description: data.description ?? undefined,
    registrationOpen: data.registration_open,
  };
}

export async function registerForTowerSwing(input: RegistrationInput): Promise<RegisterResult> {
  const supabase = await createClient();
  return registerCore(input, {
    rpc: async (payload) => {
      const { data, error } = await supabase.rpc("register_tower", { p: payload });
      return { data, error };
    },
    // Send after the response so a slow SMTP server never delays the visitor.
    sendConfirmation: async (data) => {
      after(() =>
        sendRegistrationConfirmation(data).catch((err) =>
          console.error("Email sending failed, but registration was saved:", err),
        ),
      );
    },
  });
}
