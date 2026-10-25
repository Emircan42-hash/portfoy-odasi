import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

const schema = z.object({
  propertyId: z.string(),
  photoId: z.string().optional(),
  sceneId: z.string().optional(),
  kind: z.enum(["LIKE", "DISLIKE", "NOTE"]),
  text: z.string().trim().max(500).optional(),
});

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400 });
  if (body.data.kind === "NOTE" && !body.data.text) return Response.json({ error: "text_required" }, { status: 400 });

  const room = await prisma.room.findUnique({
    where: { token },
    select: { id: true, agentId: true, customerName: true, items: { select: { propertyId: true, property: { select: { title: true } } } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });
  const item = room.items.find((i) => i.propertyId === body.data.propertyId);
  if (!item) return Response.json({ error: "not_in_room" }, { status: 400 });

  const reaction = await prisma.reaction.create({
    data: {
      roomId: room.id,
      propertyId: body.data.propertyId,
      photoId: body.data.photoId,
      sceneId: body.data.sceneId,
      kind: body.data.kind,
      text: body.data.text || null,
    },
    select: { id: true, kind: true, text: true, photoId: true, sceneId: true },
  });

  // Beğen/olmaz sessiz kalır (çok sık); yalnız notlar bildirim üretir
  if (body.data.kind === "NOTE" && body.data.text) {
    await notify({
      userId: room.agentId,
      kind: "NOTE",
      title: `${room.customerName} not bıraktı: "${body.data.text}"`,
      body: item.property.title,
      href: `/odalar/${room.id}`,
    });
  }

  return Response.json(reaction, { status: 201 });
}
