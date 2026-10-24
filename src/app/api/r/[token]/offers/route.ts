import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, items: { select: { propertyId: true } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });
  if (!room.items.some((i) => i.propertyId === body.data.propertyId)) {
    return Response.json({ error: "not_in_room" }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      roomId: room.id,
      propertyId: body.data.propertyId,
      amount: body.data.amount,
      note: body.data.note || null,
    },
    select: { id: true, status: true },
  });

  return Response.json(offer, { status: 201 });
}
