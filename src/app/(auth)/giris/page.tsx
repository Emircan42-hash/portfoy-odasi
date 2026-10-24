import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/panel");

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-brand-dark p-4 text-brand-dark-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--brand-glow), transparent)" }}
      />
      <div className="relative flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Wordmark inverted />
          <p className="font-display text-3xl font-semibold leading-tight">Müşteriye tek link, size tüm hikâye.</p>
          <p className="text-sm text-brand-dark-muted">Danışman ve şirket sahibi girişi.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-float backdrop-blur">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
