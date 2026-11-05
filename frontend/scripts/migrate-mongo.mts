/**
 * One-off copy of Tower Swing data from MongoDB to Supabase.
 *
 *   mongoexport --uri "$MONGODB_URI" --collection events --jsonArray --out events.json
 *   mongoexport --uri "$MONGODB_URI" --collection registrations --jsonArray --out registrations.json
 *   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/migrate-mongo.mts events.json registrations.json
 *
 * Safe to re-run: events upsert on (year, name), registrations on email.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { mapEvent, mapRegistration, mongoId } from "./mongo-map.ts";

async function main() {
  const [eventsFile, registrationsFile] = process.argv.slice(2);
  if (!eventsFile || !registrationsFile) {
    console.error("Usage: node scripts/migrate-mongo.mts <events.json> <registrations.json>");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const events = JSON.parse(readFileSync(eventsFile, "utf8")) as Record<string, unknown>[];
  const registrations = JSON.parse(readFileSync(registrationsFile, "utf8")) as Record<string, unknown>[];

  // Insert inactive first, then activate, so the "one active event" index never trips mid-import.
  const idMap = new Map<string, string>();
  let activeId: string | null = null;
  for (const doc of events) {
    const row = mapEvent(doc);
    const { data, error } = await db
      .from("tower_events")
      .upsert({ ...row, is_active: false }, { onConflict: "year,name" })
      .select("id")
      .single();
    if (error) throw new Error(`Event "${row.name}": ${error.message}`);
    idMap.set(mongoId(doc._id)!, data.id);
    if (row.is_active) activeId = data.id;
  }
  if (activeId) {
    await db.from("tower_events").update({ is_active: false }).neq("id", activeId);
    const { error } = await db.from("tower_events").update({ is_active: true }).eq("id", activeId);
    if (error) throw new Error(`Activate: ${error.message}`);
  }

  const rows = registrations.map((doc) => mapRegistration(doc, idMap));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from("tower_registrations").upsert(rows.slice(i, i + 200), { onConflict: "email" });
    if (error) throw new Error(`Registrations: ${error.message}`);
  }

  const [{ count: ev }, { count: reg }] = await Promise.all([
    db.from("tower_events").select("*", { count: "exact", head: true }),
    db.from("tower_registrations").select("*", { count: "exact", head: true }),
  ]);
  console.log(`Imported ${events.length} events and ${rows.length} registrations.`);
  console.log(`Supabase now has ${ev} events and ${reg} registrations.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
