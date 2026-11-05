import { Dancing_Script } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "./LoginForm";
import { safeNext } from "@/lib/profile";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export const metadata = { title: "Sign in – Tower Swing" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70vh] bg-white">
        <div className="max-w-md mx-auto px-4 py-12">
          <h1 className={`text-4xl font-bold text-blue-900 mb-6 ${dancingScript.className}`}>Sign in</h1>
          {error && <p className="mb-4 text-red-600">That sign-in link has expired or was already used. Please request a new one.</p>}
          <LoginForm next={safeNext(next)} />
        </div>
      </main>
    </>
  );
}
