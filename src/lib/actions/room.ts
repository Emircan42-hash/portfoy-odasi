"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope, roomScope } from "@/lib/scope";

// URL'de okunaklı, karışmayan karakterler (0/o, 1/l yok)
const token = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);

const schema = z.object({
  customerName: z.string().min(2, "Müşteri adı gerekli"),
  customerPhone: z.string().optional(),
  note: z.string().optional(),
});

export type RoomFormState = { error?: string };

export async function createRoom(_prev: RoomFormState, formData: FormData): Promise<RoomFormState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form hatalı" };

  const propertyIds = formData.getAll("propertyIds").map(String).filter(Boolean);
  if (propertyIds.length === 0) return { error: "En az bir daire seçin" };

  // Sadece kendi görebildiği daireler odaya girebilir
  const allowed = await prisma.property.findMany({
    where: { ...propertyScope(user), id: { in: propertyIds } },
    select: { id: true },
  });
  if (allowed.length !== propertyIds.length) return { error: "Seçilen dairelerden biri erişilebilir değil" };

  const room = await prisma.room.create({
    data: {
      token: token(),
      agentId: user.id,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone || null,
      note: parsed.data.note || null,
      items: { create: propertyIds.map((propertyId, order) => ({ propertyId, order })) },
    },
  });

  redirect(`/odalar/${room.id}`);
}

export async function updateAppointmentStatus(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const status = z.enum(["REQUESTED", "CONFIRMED", "DONE", "CANCELLED"]).parse(formData.get("status"));
  await prisma.appointment.updateMany({ where: { id, room: roomScope(user) }, data: { status } });
  revalidatePath("/randevular");
  revalidatePath("/odalar");
}
