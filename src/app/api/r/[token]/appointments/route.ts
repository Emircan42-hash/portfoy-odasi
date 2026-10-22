import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  propertyId: z.string(),
  startsAt: z.string().datetime(),
  customerNote: z.string().trim().max(500).optional(),
});

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400 });

  const startsAt = new Date(body.data.startsAt);
  if (startsAt.getTime() < Date.now()) return Response.json({ error: "past" }, { status: 400 });

  const room = await prisma.room.findUnique({
    where: { token },
    select: { id: true, items: { select: { propertyId: true } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });
  if (!room.items.some((i) => i.propertyId === body.data.propertyId)) {
    return Response.json({ error: "not_in_room" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      roomId: room.id,
      propertyId: body.data.propertyId,
      startsAt,
      customerNote: body.data.customerNote || null,
    },
    select: { id: true, startsAt: true, status: true },
  });

  return Response.json(appointment, { status: 201 });
}
