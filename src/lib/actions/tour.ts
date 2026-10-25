"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";

const linksSchema = z
  .array(
    z.object({
      toSceneId: z.string().min(1),
      yaw: z.number().min(-Math.PI * 2).max(Math.PI * 2),
      pitch: z.number().min(-Math.PI / 2).max(Math.PI / 2),
    }),
  )
  .max(20);

export type SceneLink = z.infer<typeof linksSchema>[number];

/** Bir karenin kapı noktalarını (başka karelere geçişler) kaydeder. */
export async function saveSceneLinks(sceneId: string, rawLinks: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = linksSchema.safeParse(rawLinks);
  if (!parsed.success) return { ok: false, error: "Kapı verisi geçersiz" };

  const scene = await prisma.tourScene.findFirst({ where: { id: sceneId, property: propertyScope(user) } });
  if (!scene) return { ok: false, error: "Kare bulunamadı" };

  const siblings = await prisma.tourScene.findMany({ where: { propertyId: scene.propertyId }, select: { id: true } });
  const valid = new Set(siblings.map((s) => s.id));
  const links = parsed.data.filter((l) => l.toSceneId !== sceneId && valid.has(l.toSceneId));

  await prisma.tourScene.update({ where: { id: sceneId }, data: { links } });
  revalidatePath(`/portfoy/${scene.propertyId}`);
  return { ok: true };
}
