import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { formatDateTime } from "@/lib/utils";

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
    select: { id: true, agentId: true, customerName: true, items: { select: { propertyId: true, property: { select: { title: true } } } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });
  const item = room.items.find((i) => i.propertyId === body.data.propertyId);
  if (!item) return Response.json({ error: "not_in_room" }, { status: 400 });

  const appointment = await prisma.appointment.create({
    data: {
      roomId: room.id,
      propertyId: body.data.propertyId,
      startsAt,
      customerNote: body.data.customerNote || null,
    },
    select: { id: true, startsAt: true, status: true },
  });

  await notify({
    userId: room.agentId,
    kind: "APPOINTMENT",
    title: `${room.customerName} randevu istedi: ${formatDateTime(startsAt)}`,
    body: `${item.property.title}${body.data.customerNote ? ` · "${body.data.customerNote}"` : ""}`,
    href: "/randevular",
  });

  return Response.json(appointment, { status: 201 });
}
