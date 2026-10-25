import sharp from "sharp";

export type Processed = { data: Buffer; width: number; height: number; warning?: string };

/** Normal fotoğraf: EXIF'e göre döndür, en fazla 2400 px genişlik, JPEG. */
export async function processPhoto(input: Buffer): Promise<Processed> {
  const img = sharp(input, { failOn: "none" }).rotate();
  const out = await img
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height };
}

/**
 * 360° kare: equirectangular (2:1) beklenir. Telefon GPU'ları için 6144 px genişliğe indirilir.
 * Oran 2:1'den uzaksa yine kaydedilir ama uyarı döner; turda bozuk görünür.
 */
export async function processPanorama(input: Buffer): Promise<Processed> {
  const img = sharp(input, { failOn: "none", limitInputPixels: false }).rotate();
  const meta = await img.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  let warning: string | undefined;
  if (w && h && Math.abs(w / h - 2) > 0.1) {
    warning = `Bu kare 2:1 oranında değil (${w}×${h}); 360° turda bozuk görünebilir. Kameranın "360 fotoğraf" modunu kullanın.`;
  }
  const out = await img
    .resize({ width: 6144, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height, warning };
}
