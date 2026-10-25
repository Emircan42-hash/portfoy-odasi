"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUp, ImagePlus, Rotate3d, Star, Trash2 } from "lucide-react";
import { deletePhoto, deleteScene, moveSceneUp, renameScene, setCoverPhoto, updatePhotoCaption } from "@/lib/actions/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Photo = { id: string; url: string; caption: string | null; order: number };
type Scene = { id: string; name: string; panoramaUrl: string; order: number };

type UploadState = { active: boolean; percent: number; message?: string; error?: string };

function useUploader(propertyId: string, kind: "photo" | "panorama") {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ active: false, percent: 0 });

  function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    const form = new FormData();
    form.append("propertyId", propertyId);
    form.append("kind", kind);
    list.forEach((f) => form.append("files", f));

    // XHR: fetch ilerleme vermez; büyük 360° karelerde yüzde görmek lazım
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/panel/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setState({ active: true, percent: Math.round((e.loaded / e.total) * 90) });
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          results: { name: string; warning?: string }[];
          errors: { name: string; error: string }[];
        };
        const warnings = body.results.filter((r) => r.warning).map((r) => `${r.name}: ${r.warning}`);
        const errors = body.errors.map((e) => `${e.name}: ${e.error}`);
        setState({
          active: false,
          percent: 100,
          message: body.results.length ? `${body.results.length} dosya yüklendi.` : undefined,
          error: [...errors, ...warnings].join(" · ") || undefined,
        });
      } catch {
        setState({ active: false, percent: 0, error: "Sunucu beklenmeyen cevap verdi." });
      }
      router.refresh();
    };
    xhr.onerror = () => setState({ active: false, percent: 0, error: "Yükleme başarısız; bağlantıyı kontrol edin." });
    setState({ active: true, percent: 0 });
    xhr.send(form);
  }

  return { state, upload };
}

function DropZone({
  title,
  hint,
  icon: Icon,
  onFiles,
  state,
}: {
  title: string;
  hint: string;
  icon: typeof ImagePlus;
  onFiles: (files: FileList) => void;
  state: UploadState;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          over ? "border-primary bg-accent" : "border-border bg-muted/40 hover:bg-muted",
        )}
      >
        <Icon className="size-6 text-primary" />
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </button>
      {state.active && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${state.percent}%` }} />
        </div>
      )}
      {state.message && <p className="text-xs text-success">{state.message}</p>}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

export function PhotoManager({ propertyId, photos }: { propertyId: string; photos: Photo[] }) {
  const { state, upload } = useUploader(propertyId, "photo");
  return (
    <div className="flex flex-col gap-4">
      <DropZone
        title="Fotoğraf yükle"
        hint="Sürükleyip bırakın ya da tıklayın; birden fazla seçebilirsiniz. İlk fotoğraf kapak olur."
        icon={ImagePlus}
        onFiles={upload}
        state={state}
      />
      {photos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, i) => (
            <li key={photo.id} className="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-xs">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                {i === 0 && (
                  <Badge variant="glass" className="absolute left-2 top-2">
                    <Star className="size-3" /> Kapak
                  </Badge>
                )}
              </div>
              <form action={updatePhotoCaption} className="flex gap-1">
                <input type="hidden" name="id" value={photo.id} />
                <Input name="caption" defaultValue={photo.caption ?? ""} placeholder="Oda adı (Salon, Mutfak…)" className="h-8 text-xs" />
                <Button type="submit" size="sm" variant="outline">
                  Kaydet
                </Button>
              </form>
              <div className="flex justify-between">
                {i !== 0 ? (
                  <form action={setCoverPhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      <Star /> Kapak yap
                    </Button>
                  </form>
                ) : (
                  <span />
                )}
                <form action={deletePhoto}>
                  <input type="hidden" name="id" value={photo.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 /> Sil
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SceneManager({ propertyId, scenes }: { propertyId: string; scenes: Scene[] }) {
  const { state, upload } = useUploader(propertyId, "panorama");
  return (
    <div className="flex flex-col gap-4">
      <DropZone
        title="360° kare yükle"
        hint="Kameranın 360 fotoğraf modu; 2:1 oranlı tek kare. Dosya adı oda adı olur (salon.jpg → Salon)."
        icon={Rotate3d}
        onFiles={upload}
        state={state}
      />
      {scenes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {scenes.map((scene, i) => (
            <li key={scene.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-2 shadow-xs">
              <div className="relative h-16 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={scene.panoramaUrl} alt={scene.name} fill sizes="128px" className="object-cover" />
              </div>
              <form action={renameScene} className="flex min-w-0 flex-1 gap-1">
                <input type="hidden" name="id" value={scene.id} />
                <Input name="name" defaultValue={scene.name} className="h-8 max-w-xs text-sm" />
                <Button type="submit" size="sm" variant="outline">
                  Kaydet
                </Button>
              </form>
              <div className="flex items-center gap-1">
                {i === 0 ? (
                  <Badge variant="secondary">Başlangıç odası</Badge>
                ) : (
                  <form action={moveSceneUp}>
                    <input type="hidden" name="id" value={scene.id} />
                    <Button type="submit" size="sm" variant="ghost" aria-label="Yukarı al">
                      <ArrowUp />
                    </Button>
                  </form>
                )}
                <form action={deleteScene}>
                  <input type="hidden" name="id" value={scene.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Sil">
                    <Trash2 />
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
