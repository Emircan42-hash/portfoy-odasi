import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/panel");

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-50 shadow-lg">
        <h1 className="text-xl font-semibold">Portföy Odası</h1>
        <p className="mt-1 text-sm text-neutral-400">Danışman ve şirket sahibi girişi.</p>
        <LoginForm />
      </div>
    </main>
  );
}
