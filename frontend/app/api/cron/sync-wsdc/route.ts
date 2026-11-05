import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncWsdcEvents, DANCE_EVENT_COLUMNS, type DanceEventRow } from "@/lib/wsdc/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WSDC_URL = "https://worldsdc.com/events/";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://towerswing.fi";
  try {
    const result = await syncWsdcEvents({
      fetchHtml: async () => {
        const res = await fetch(WSDC_URL, {
          headers: { "User-Agent": `TowerSwingPartnerQueue/1.0 (+${site})` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`WSDC responded ${res.status}`);
        return res.text();
      },
      loadExisting: async () => {
        const { data, error } = await db.from("dance_events").select(DANCE_EVENT_COLUMNS);
        if (error) throw error;
        return (data ?? []) as DanceEventRow[];
      },
      save: async (rows) => {
        for (let i = 0; i < rows.length; i += 200) {
          const { error } = await db.from("dance_events").upsert(rows.slice(i, i + 200), { onConflict: "id" });
          if (error) throw error;
        }
      },
      purge: async () => {
        const { data, error } = await db.rpc("purge_old_events");
        if (error) throw error;
        return data as number;
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("WSDC sync failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status: 500 });
  }
}
