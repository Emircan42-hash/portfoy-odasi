"use client";

import { useActionState } from "react";
import { createProperty, type PropertyFormState } from "@/lib/actions/property";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function PropertyForm() {
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(createProperty, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Başlık">
        <Input name="title" placeholder="Mavişehir'de deniz manzaralı 2+1" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tür">
          <select name="listingType" className="border-input h-9 rounded-md border bg-background px-3 text-sm" defaultValue="RENT">
            <option value="RENT">Kiralık</option>
            <option value="SALE">Satılık</option>
          </select>
        </Field>
        <Field label="Fiyat (TL)">
          <Input name="price" inputMode="numeric" placeholder="45000" required />
        </Field>
        <Field label="Oda">
          <Input name="roomsLabel" placeholder="2+1" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Aidat (TL/ay)">
          <Input name="dues" inputMode="numeric" />
        </Field>
        <Field label="Depozito (TL, kiralık)">
          <Input name="deposit" inputMode="numeric" />
        </Field>
        <Field label="m²">
          <Input name="sqm" inputMode="numeric" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kat">
          <Input name="floor" inputMode="numeric" />
        </Field>
        <Field label="Bina yaşı">
          <Input name="buildingAge" inputMode="numeric" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Şehir">
          <Input name="city" defaultValue="İzmir" required />
        </Field>
        <Field label="İlçe">
          <Input name="district" placeholder="Karşıyaka" required />
        </Field>
        <Field label="Mahalle">
          <Input name="neighborhood" placeholder="Mavişehir" />
        </Field>
      </div>
      <Field label="Açıklama">
        <Textarea name="description" placeholder="Site içinde, kapalı otopark, salon denize bakar…" />
      </Field>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Fotoğraflar ve 360° kareler kaydettikten sonra daire sayfasından yüklenir.</p>
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet ve fotoğraf yükle"}
        </Button>
      </div>
    </form>
  );
}
