import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, items: { select: { propertyId: true } } },
  });
  if (!room) return Response.json({ error: "not_found" }, { status: 404 });

  const { propertyId, sceneId, photoId, ...rest } = body.data;
  if (propertyId && !room.items.some((i) => i.propertyId === propertyId)) {
    return Response.json({ error: "not_in_room" }, { status: 400 });
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
