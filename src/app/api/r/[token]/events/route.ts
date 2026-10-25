import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

const schema = z.object({
  kind: z.enum(["ROOM_OPEN", "PROPERTY_VIEW", "PHOTO_VIEW", "TOUR_VIEW", "SCENE_VIEW"]),
  propertyId: z.string().optional(),
  sceneId: z.string().optional(),
  photoId: z.string().optional(),
  durationMs: z.number().int().nonnegative().max(6 * 60 * 60 * 1000).optional(),
});

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400 });

  const room = await prisma.room.findUnique({
    where: { token },
    select: { id: true, agentId: true, customerName: true, items: { select: { propertyId: true } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });

  const { propertyId, sceneId, photoId, ...rest } = body.data;
  if (propertyId && !room.items.some((i) => i.propertyId === propertyId)) {
    return Response.json({ error: "not_in_room" }, { status: 400 });
  }

  // Linkin ilk açılışı danışman için haberdir; sonrakiler sadece panelde sayılır
  if (rest.kind === "ROOM_OPEN") {
    const opened = await prisma.roomEvent.count({ where: { roomId: room.id, kind: "ROOM_OPEN" } });
    if (opened === 0) {
      await notify({
        userId: room.agentId,
        kind: "ROOM_OPEN",
        title: `${room.customerName} linki açtı`,
        body: `${room.items.length} daire gösteriliyor`,
        href: `/odalar/${room.id}`,
      });
    }
  }

  await prisma.roomEvent.create({
    data: {
      roomId: room.id,
      propertyId,
      kind: rest.kind,
      durationMs: rest.durationMs,
      meta: sceneId || photoId ? { sceneId, photoId } : undefined,
    },
  });

  return new Response(null, { status: 204 });
}
