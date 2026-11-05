import { redirect } from "next/navigation";
import { Dancing_Script } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/profile";
import { getCurrentProfile } from "./actions";
import { signOut } from "../auth/actions";
import ProfileForm from "./ProfileForm";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export const metadata = { title: "Your account – Tower Swing" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  const { next } = await searchParams;
  const profile = await getCurrentProfile();

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70vh] bg-white">
        <div className="max-w-md mx-auto px-4 py-12">
          <h1 className={`text-4xl font-bold text-blue-900 mb-2 ${dancingScript.className}`}>
            {profile ? "Your account" : "Welcome!"}
          </h1>
          <p className="text-gray-600 mb-8">
            {profile ? `Signed in as ${user.email}` : "Tell other dancers who you are before joining a queue."}
          </p>
          <ProfileForm
            displayName={profile?.display_name ?? ""}
            phone={profile?.phone ?? ""}
            next={next ? safeNext(next) : undefined}
          />
          <form action={signOut} className="mt-10">
            <button className="text-gray-500 underline hover:text-gray-800">Sign out</button>
          </form>
        </div>
      </main>
    </>
  );
}
