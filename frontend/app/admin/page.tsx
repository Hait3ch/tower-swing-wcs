import { redirect } from "next/navigation";
import { Dancing_Script } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "../auth/login/LoginForm";
import { signOut } from "../auth/actions";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export const metadata = { title: "Admin – Tower Swing" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) redirect("/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className={`text-3xl font-bold text-blue-900 mb-2 text-center ${dancingScript.className}`}>Admin Access</h1>
          {user ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                <strong>{user.email}</strong> is not an admin.
              </p>
              <form action={signOut}>
                <button className="text-blue-700 underline">Sign in with another email</button>
              </form>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6 text-center">We&apos;ll email you a sign-in link.</p>
              <LoginForm next="/admin/dashboard" />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
