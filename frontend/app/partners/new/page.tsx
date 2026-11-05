import { redirect } from "next/navigation";
import { Dancing_Script } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/partners/events";
import AddEventForm from "./AddEventForm";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export const metadata = { title: "Add an event – Tower Swing" };

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/partners/new");

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-4 py-10">
          <h1 className={`text-4xl font-bold text-blue-900 ${dancingScript.className}`}>Add an event</h1>
          <p className="mt-2 mb-8 text-gray-600">
            WSDC events in Europe are added automatically. Add other events here, e.g. local weekends and parties.
          </p>
          <AddEventForm today={todayIso()} />
        </div>
      </main>
    </>
  );
}
