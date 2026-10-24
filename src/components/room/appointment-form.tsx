"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AppointmentForm({ token, propertyId }: { token: string; propertyId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    const res = await fetch(`/api/r/${token}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        customerNote: String(form.get("customerNote") ?? ""),
      }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-2 text-sm">
          <CalendarCheck className="size-4 text-success" />
          Randevu talebiniz danışmanınıza iletildi; sizi arayıp onaylayacak.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Gidip görmek ister misiniz?</CardTitle>
        <CardDescription>Size uygun bir gün ve saat seçin, danışmanınız onaylasın.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startsAt">Tarih ve saat</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerNote">Not (isteğe bağlı)</Label>
            <Textarea id="customerNote" name="customerNote" placeholder="Eşimle birlikte geleceğiz" className="min-h-14" />
          </div>
          {state === "error" && <p className="text-sm text-destructive">Gönderilemedi, tekrar deneyin.</p>}
          <Button type="submit" disabled={state === "sending"} className="self-start">
            {state === "sending" ? "Gönderiliyor…" : "Randevu iste"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
