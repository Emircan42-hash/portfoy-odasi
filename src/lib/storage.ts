import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Dosyalar şimdilik yerel diske yazılır (UPLOAD_DIR, varsayılan ./uploads) ve
// /api/files/<key> üzerinden servis edilir. S3'e geçince yalnız bu dosya değişir.

const ROOT = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

function resolveKey(key: string) {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep) && full !== ROOT) throw new Error("invalid key");
  return full;
}

export function publicUrl(key: string) {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** URL'den anahtarı geri çıkarır; dış URL'ler (demo, S3) için null döner. */
export function keyFromUrl(url: string) {
  const prefix = "/api/files/";
  if (!url.startsWith(prefix)) return null;
  return url
    .slice(prefix.length)
    .split("/")
    .map(decodeURIComponent)
    .join("/");
}

export async function saveFile(key: string, data: Buffer) {
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return publicUrl(key);
}

export async function readStoredFile(key: string) {
  const full = resolveKey(key);
  const info = await stat(full);
  if (!info.isFile()) throw new Error("not a file");
  return { data: await readFile(full), size: info.size, mtime: info.mtime };
}

export async function deleteFile(key: string) {
  try {
    await unlink(resolveKey(key));
  } catch {
    // dosya zaten yoksa sorun değil
  }
}
