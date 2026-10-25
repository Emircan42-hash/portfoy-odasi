"use client";

import { useEffect, useRef, useState } from "react";
import { Check, DoorOpen, Loader2, Trash2 } from "lucide-react";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { saveSceneLinks, type SceneLink } from "@/lib/actions/tour";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Scene = { id: string; name: string; panoramaUrl: string; links: SceneLink[] };

type ViewerHandle = {
  viewer: import("@photo-sphere-viewer/core").Viewer;
  markers: import("@photo-sphere-viewer/markers-plugin").MarkersPlugin;
};

/**
 * Kapı noktası aracı: aktif karede panoramaya tıkla, seçili odaya kapı koy.
 * Her değişiklik anında kaydedilir; müşteri turu bu kapılarla gezer.
 */
export function TourEditor({ scenes: initial }: { scenes: Scene[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ViewerHandle | null>(null);
  const [scenes, setScenes] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id);
  const [targetId, setTargetId] = useState(initial.find((s) => s.id !== initial[0]?.id)?.id ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [ready, setReady] = useState(false);

  // Tıklama olayında güncel state'e ulaşmak için ref'ler
  const activeRef = useRef(activeId);
  const targetRef = useRef(targetId);
  const scenesRef = useRef(scenes);
  useEffect(() => {
    activeRef.current = activeId;
    targetRef.current = targetId;
    scenesRef.current = scenes;
  }, [activeId, targetId, scenes]);

  const active = scenes.find((s) => s.id === activeId);
  const nameOf = (id: string) => scenes.find((s) => s.id === id)?.name ?? "?";

  function drawMarkers(h: ViewerHandle, scene: Scene | undefined) {
    if (!scene) return;
    h.markers.setMarkers(
      scene.links.map((l, i) => ({
        id: `door-${i}`,
        position: { yaw: l.yaw, pitch: l.pitch },
        html: `<div class="door-marker">→ ${nameOf(l.toSceneId)}</div>`,
        anchor: "center center",
        data: { index: i },
      })),
    );
  }

  async function persist(sceneId: string, links: SceneLink[]) {
    setStatus("saving");
    const res = await saveSceneLinks(sceneId, links);
    setStatus(res.ok ? "saved" : "error");
  }

  function updateLinks(sceneId: string, next: SceneLink[]) {
    const updated = scenesRef.current.map((s) => (s.id === sceneId ? { ...s, links: next } : s));
    setScenes(updated);
    scenesRef.current = updated;
    const h = handleRef.current;
    if (h) drawMarkers(h, updated.find((s) => s.id === sceneId));
    void persist(sceneId, next);
  }

  // Görüntüleyiciyi bir kez kur
  useEffect(() => {
    const container = containerRef.current;
    const first = initial[0];
    if (!container || !first) return;
    let destroyed = false;

    (async () => {
      const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
        import("@photo-sphere-viewer/core"),
        import("@photo-sphere-viewer/markers-plugin"),
      ]);
      if (destroyed) return;
      const viewer = new Viewer({
        container,
        panorama: first.panoramaUrl,
        navbar: ["zoom", "move", "fullscreen"],
        plugins: [MarkersPlugin],
      });
      const markers = viewer.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>;
      const h: ViewerHandle = { viewer, markers };
      handleRef.current = h;

      viewer.addEventListener("ready", () => {
        drawMarkers(h, scenesRef.current.find((s) => s.id === activeRef.current));
        setReady(true);
      }, { once: true });

      // Panoramaya tıklama: seçili odaya kapı koy (işaretçiye tıklama hariç)
      viewer.addEventListener("click", ({ data }) => {
        if (data.rightclick || data.marker) return;
        const sceneId = activeRef.current;
        const to = targetRef.current;
        if (!sceneId || !to || to === sceneId) return;
        const scene = scenesRef.current.find((s) => s.id === sceneId);
        if (!scene) return;
        updateLinks(sceneId, [...scene.links, { toSceneId: to, yaw: data.yaw, pitch: data.pitch }]);
      });

      // İşaretçiye tıklayınca kapıyı kaldır
      markers.addEventListener("select-marker", ({ marker }) => {
        const index = (marker.data as { index: number } | undefined)?.index;
        const sceneId = activeRef.current;
        const scene = scenesRef.current.find((s) => s.id === sceneId);
        if (index === undefined || !scene || !sceneId) return;
        updateLinks(sceneId, scene.links.filter((_, i) => i !== index));
      });
    })();

    return () => {
      destroyed = true;
      handleRef.current?.viewer.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aktif kare değişince panoramayı değiştir
  useEffect(() => {
    const h = handleRef.current;
    const scene = scenes.find((s) => s.id === activeId);
    if (!h || !scene || !ready) return;
    h.markers.clearMarkers();
    void h.viewer.setPanorama(scene.panoramaUrl, { transition: false }).then(() => drawMarkers(h, scene));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, ready]);

  if (scenes.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">Kapı yerleştirmek için en az iki 360° kare gerekir. Önce kareleri yükleyin.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Düzenlenen oda:</span>
        {scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveId(s.id);
              if (targetId === s.id) setTargetId(scenes.find((x) => x.id !== s.id)?.id ?? "");
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              s.id === activeId ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {s.name}
            {s.links.length > 0 && <span className="ml-1 opacity-70">· {s.links.length} kapı</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-accent/40 p-3 text-sm">
        <DoorOpen className="size-4 text-primary" />
        <span>
          Panoramada <b>kapının olduğu yere tıkla</b>; geçilecek oda:
        </span>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="border-input h-8 rounded-md border bg-card px-2 text-sm"
        >
          {scenes
            .filter((s) => s.id !== activeId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
        <span className="text-muted-foreground">Bir kapıyı kaldırmak için işaretçisine tıkla.</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          {status === "saving" && (
            <>
              <Loader2 className="size-3 animate-spin" /> kaydediliyor
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="size-3 text-success" /> kaydedildi
            </>
          )}
          {status === "error" && <span className="text-destructive">kaydedilemedi</span>}
        </span>
      </div>

      <div ref={containerRef} className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-brand-dark" />

      {active && active.links.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {active.links.map((l, i) => (
            <li key={i}>
              <Badge variant="outline" className="gap-2 py-1 pr-1">
                {active.name} → {nameOf(l.toSceneId)}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-5"
                  aria-label="Kapıyı kaldır"
                  onClick={() => updateLinks(active.id, active.links.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-3" />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
