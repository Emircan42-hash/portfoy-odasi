import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { processPanorama, processPhoto } from "@/lib/images";
import { saveFile } from "@/lib/storage";

const MAX_BYTES = 60 * 1024 * 1024; // 360° kareler büyük olabilir

/**
 * Panelden fotoğraf / 360° kare yükleme. multipart/form-data:
 *   propertyId, kind = "photo" | "panorama", files (çoklu)
 * Her dosya işlenir, diske yazılır ve Photo ya da TourScene satırı açılır.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const propertyId = String(form.get("propertyId") ?? "");
  const kind = String(form.get("kind") ?? "photo");
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!propertyId || files.length === 0) return Response.json({ error: "invalid" }, { status: 400 });
  if (kind !== "photo" && kind !== "panorama") return Response.json({ error: "invalid_kind" }, { status: 400 });

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ...propertyScope(session.user) },
    select: { id: true, _count: { select: { photos: true, scenes: true } } },
  });
  if (!property) return Response.json({ error: "not_found" }, { status: 404 });

  const results: { id: string; url: string; name: string; warning?: string }[] = [];
  const errors: { name: string; error: string }[] = [];
  let order = kind === "photo" ? property._count.photos : property._count.scenes;

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      errors.push({ name: file.name, error: "Dosya 60 MB'tan büyük" });
      continue;
    }
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const processed = kind === "photo" ? await processPhoto(input) : await processPanorama(input);
      const key = `properties/${propertyId}/${kind === "photo" ? "p" : "s"}-${nanoid(12)}.jpg`;
      const url = await saveFile(key, processed.data);
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

      if (kind === "photo") {
        const photo = await prisma.photo.create({ data: { propertyId, url, order: order++ } });
        results.push({ id: photo.id, url, name: file.name });
      } else {
        const scene = await prisma.tourScene.create({
          data: { propertyId, panoramaUrl: url, name: baseName || `Oda ${order + 1}`, order: order++ },
        });
        results.push({ id: scene.id, url, name: scene.name, warning: processed.warning });
      }
    } catch (e) {
      errors.push({ name: file.name, error: e instanceof Error ? e.message : "İşlenemedi" });
    }
  }

  return Response.json({ results, errors }, { status: errors.length && !results.length ? 400 : 201 });
}
