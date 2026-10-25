"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";

const intField = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(String(v).replace(/[^\d]/g, ""))),
  z.number().int().nonnegative().optional(),
);

const schema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter"),
  listingType: z.enum(["RENT", "SALE"]),
  price: z.preprocess((v) => Number(String(v).replace(/[^\d]/g, "")), z.number().int().positive("Fiyat gerekli")),
  dues: intField,
  deposit: intField,
  roomsLabel: z.string().min(1, "Oda sayısı gerekli"),
  sqm: intField,
  floor: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().optional()),
  buildingAge: intField,
  city: z.string().min(1, "Şehir gerekli"),
  district: z.string().min(1, "İlçe gerekli"),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

export type PropertyFormState = { error?: string };

export async function createProperty(_prev: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form hatalı" };
  }
  const d = parsed.data;

  const property = await prisma.property.create({
    data: {
      officeId: user.officeId,
      agentId: user.id,
      title: d.title,
      listingType: d.listingType,
      price: d.price,
      dues: d.dues,
      deposit: d.deposit,
      roomsLabel: d.roomsLabel,
      sqm: d.sqm,
      floor: d.floor,
      buildingAge: d.buildingAge,
      city: d.city,
      district: d.district,
      neighborhood: d.neighborhood || null,
      address: d.address || null,
      description: d.description || null,
    },
  });

  // Fotoğraf ve 360° kareler daire sayfasından yüklenir
  redirect(`/portfoy/${property.id}`);
}
