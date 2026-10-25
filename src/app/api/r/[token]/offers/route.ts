import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { formatTL } from "@/lib/utils";

const schema = z.object({
  propertyId: z.string(),
  amount: z.number().int().positive().max(10_000_000_000),
  note: z.string().trim().max(500).optional(),
});

type Params = { params: Promise<{ token: string }> };

// Müşteri teklif verir; cevapta tutar dönmez, müşteri yalnız "iletildi" görür.
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400 });

  const room = await prisma.room.findUnique({
    where: { token },
    select: { id: true, agentId: true, customerName: true, items: { select: { propertyId: true, property: { select: { title: true, listingType: true } } } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });
  const item = room.items.find((i) => i.propertyId === body.data.propertyId);
  if (!item) return Response.json({ error: "not_in_room" }, { status: 400 });

  const offer = await prisma.offer.create({
    data: {
      roomId: room.id,
      propertyId: body.data.propertyId,
      amount: body.data.amount,
      note: body.data.note || null,
    },
    select: { id: true, status: true },
  });

  await notify({
    userId: room.agentId,
    kind: "OFFER",
    title: `${room.customerName} teklif verdi: ${formatTL(body.data.amount)}${item.property.listingType === "RENT" ? " / ay" : ""}`,
    body: `${item.property.title}${body.data.note ? ` · "${body.data.note}"` : ""}`,
    href: "/teklifler",
  });

  return Response.json(offer, { status: 201 });
}
