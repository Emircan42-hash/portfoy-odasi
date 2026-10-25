"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { deleteFile, keyFromUrl } from "@/lib/storage";

async function ownedPhoto(id: string) {
  const user = await requireUser();
  const photo = await prisma.photo.findFirst({ where: { id, property: propertyScope(user) } });
  if (!photo) throw new Error("Fotoğraf bulunamadı");
  return photo;
}

async function ownedScene(id: string) {
  const user = await requireUser();
  const scene = await prisma.tourScene.findFirst({ where: { id, property: propertyScope(user) } });
  if (!scene) throw new Error("Kare bulunamadı");
  return scene;
}

export async function deletePhoto(formData: FormData) {
  const photo = await ownedPhoto(String(formData.get("id")));
  await prisma.photo.delete({ where: { id: photo.id } });
  const key = keyFromUrl(photo.url);
  if (key) await deleteFile(key);
  revalidatePath(`/portfoy/${photo.propertyId}`);
}

/** Seçilen fotoğrafı kapak yapar: sıra 0, diğerleri kayar. */
export async function setCoverPhoto(formData: FormData) {
  const photo = await ownedPhoto(String(formData.get("id")));
  const others = await prisma.photo.findMany({
    where: { propertyId: photo.propertyId, id: { not: photo.id } },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.photo.update({ where: { id: photo.id }, data: { order: 0 } }),
    ...others.map((o, i) => prisma.photo.update({ where: { id: o.id }, data: { order: i + 1 } })),
  ]);
  revalidatePath(`/portfoy/${photo.propertyId}`);
}

export async function updatePhotoCaption(formData: FormData) {
  const photo = await ownedPhoto(String(formData.get("id")));
  const caption = z.string().trim().max(80).parse(formData.get("caption") ?? "");
  await prisma.photo.update({ where: { id: photo.id }, data: { caption: caption || null } });
  revalidatePath(`/portfoy/${photo.propertyId}`);
}

export async function deleteScene(formData: FormData) {
  const scene = await ownedScene(String(formData.get("id")));
  await prisma.tourScene.delete({ where: { id: scene.id } });
  const key = keyFromUrl(scene.panoramaUrl);
  if (key) await deleteFile(key);
  // Bu kareye açılan kapıları diğer karelerden temizle
  const siblings = await prisma.tourScene.findMany({ where: { propertyId: scene.propertyId } });
  for (const s of siblings) {
    const links = Array.isArray(s.links) ? (s.links as { toSceneId: string }[]) : [];
    if (links.some((l) => l.toSceneId === scene.id)) {
      await prisma.tourScene.update({
        where: { id: s.id },
        data: { links: links.filter((l) => l.toSceneId !== scene.id) },
      });
    }
  }
  revalidatePath(`/portfoy/${scene.propertyId}`);
}

export async function renameScene(formData: FormData) {
  const scene = await ownedScene(String(formData.get("id")));
  const name = z.string().trim().min(1).max(40).parse(formData.get("name"));
  await prisma.tourScene.update({ where: { id: scene.id }, data: { name } });
  revalidatePath(`/portfoy/${scene.propertyId}`);
}

/** Kareyi bir üst sıraya alır (ilk kare turun başlangıç odasıdır). */
export async function moveSceneUp(formData: FormData) {
  const scene = await ownedScene(String(formData.get("id")));
  const ordered = await prisma.tourScene.findMany({
    where: { propertyId: scene.propertyId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const idx = ordered.findIndex((s) => s.id === scene.id);
  if (idx <= 0) return;
  [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
  await prisma.$transaction(ordered.map((s, i) => prisma.tourScene.update({ where: { id: s.id }, data: { order: i } })));
  revalidatePath(`/portfoy/${scene.propertyId}`);
}
