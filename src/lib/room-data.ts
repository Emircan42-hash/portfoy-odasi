import { prisma } from "@/lib/prisma";

/** Müşteri odası: token ile, hesapsız. Süresi dolmuşsa null. */
export async function getRoomByToken(token: string) {
  const room = await prisma.room.findUnique({
    where: { token },
    include: {
      agent: { select: { name: true, phone: true, office: { select: { name: true } } } },
      items: {
        orderBy: { order: "asc" },
        include: {
          property: {
            include: {
              photos: { orderBy: { order: "asc" } },
              scenes: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!room) return null;
  if (room.expiresAt && room.expiresAt < new Date()) return null;
  return room;
}

export type RoomWithItems = NonNullable<Awaited<ReturnType<typeof getRoomByToken>>>;
