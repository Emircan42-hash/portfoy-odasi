"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const field = "border-white/15 bg-white/5 text-brand-dark-foreground placeholder:text-brand-dark-muted focus-visible:ring-brand-glow/50";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {state.error && <p className="text-sm text-red-300">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-1 bg-brand-glow text-brand-dark hover:bg-brand-glow/90">
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}
