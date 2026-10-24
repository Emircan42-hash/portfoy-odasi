"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  token: string;
  propertyId: string;
  listingType: "RENT" | "SALE";
  /** Bu odadan bu daireye daha önce teklif verildi mi; tutar müşteriye gösterilmez. */
  alreadyOffered: boolean;
};

/**
 * Müşteri teklif verir. Teklifler yalnız danışman ve şirket sahibine görünür;
 * müşteri burada ne kendi tutarını ne başkasının teklifini görür, sadece iletildiğini.
 */
export function OfferForm({ token, propertyId, listingType, alreadyOffered }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(alreadyOffered ? "done" : "idle");
  const [again, setAgain] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Number(String(form.get("amount") ?? "").replace(/[^\d]/g, ""));
    if (!amount) return;
    setState("sending");
    const res = await fetch(`/api/r/${token}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, amount, note: String(form.get("note") ?? "") }),
    });
    setState(res.ok ? "done" : "error");
    setAgain(false);
  }

  if (state === "done" && !again) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <HandCoins className="size-4 text-success" />
          <span>Teklifiniz danışmanınıza iletildi; mülk sahibiyle görüşüp size dönecek.</span>
          <Button type="button" variant="link" size="sm" className="ml-auto" onClick={() => setAgain(true)}>
            Yeni teklif ver
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/25 bg-accent/40">
      <CardHeader>
        <CardTitle className="font-display text-xl">Teklif vermek ister misiniz?</CardTitle>
        <CardDescription>
          {listingType === "RENT" ? "Aylık kira için düşündüğünüz rakamı yazın." : "Düşündüğünüz satış rakamını yazın."} Teklifiniz yalnız
          danışmanınıza gider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">{listingType === "RENT" ? "Aylık kira teklifiniz (TL)" : "Teklifiniz (TL)"}</Label>
            <Input id="amount" name="amount" inputMode="numeric" placeholder={listingType === "RENT" ? "38000" : "7500000"} required className="bg-card text-lg tabular" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offer-note">Not (isteğe bağlı)</Label>
            <Textarea id="offer-note" name="note" placeholder="1 Kasım'da taşınabilirim, 1 yıllık sözleşme" className="min-h-14 bg-card" />
          </div>
          {state === "error" && <p className="text-sm text-destructive">Gönderilemedi, tekrar deneyin.</p>}
          <Button type="submit" disabled={state === "sending"} className="self-start">
            {state === "sending" ? "Gönderiliyor…" : "Teklifi gönder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
