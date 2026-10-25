import { readStoredFile } from "@/lib/storage";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

type Params = { params: Promise<{ key: string[] }> };

// Yüklenen dosyaları servis eder. Anahtarlar benzersiz olduğu için uzun süre önbelleğe alınabilir.
export async function GET(_request: Request, { params }: Params) {
  const { key } = await params;
  const joined = key.map(decodeURIComponent).join("/");
  if (joined.includes("..")) return new Response("Not found", { status: 404 });

  try {
    const { data, size } = await readStoredFile(joined);
    const ext = joined.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": types[ext] ?? "application/octet-stream",
        "Content-Length": String(size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
