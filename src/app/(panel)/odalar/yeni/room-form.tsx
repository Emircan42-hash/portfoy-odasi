"use client";

import { useActionState } from "react";
import { createRoom, type RoomFormState } from "@/lib/actions/room";
import { formatTL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PropertyOption = {
  id: string;
  title: string;
  listingType: "RENT" | "SALE";
  price: number;
  roomsLabel: string;
  district: string;
};

export function RoomForm({ properties, preselect }: { properties: PropertyOption[]; preselect?: string }) {
  const [state, action, pending] = useActionState<RoomFormState, FormData>(createRoom, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerName">Müşteri adı</Label>
          <Input id="customerName" name="customerName" placeholder="Ayşe ve Mehmet" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerPhone">Telefon (WhatsApp)</Label>
          <Input id="customerPhone" name="customerPhone" placeholder="+90 5xx xxx xx xx" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Müşteriye not (odanın başında görünür)</Label>
        <Textarea id="note" name="note" placeholder="Konuştuğumuz gibi deniz manzaralı olanı başa koydum…" />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Daireler</legend>
        {properties.length === 0 && <p className="text-sm text-muted-foreground">Önce portföye daire ekleyin.</p>}
        {properties.map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm hover:bg-accent">
            <input type="checkbox" name="propertyIds" value={p.id} defaultChecked={p.id === preselect} className="size-4" />
            <span className="flex-1">
              <span className="font-medium">{p.title}</span>
              <span className="block text-muted-foreground">
                {p.roomsLabel} · {p.district} · {formatTL(p.price)}
                {p.listingType === "RENT" ? " / ay" : ""}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || properties.length === 0}>
          {pending ? "Oluşturuluyor…" : "Linki oluştur"}
        </Button>
      </div>
    </form>
  );
}
