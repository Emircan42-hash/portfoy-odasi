"use client";

import { useEffect, useRef } from "react";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { sendEvent } from "@/components/room/tracker";

export type TourSceneInput = {
  id: string;
  name: string;
  panoramaUrl: string;
  links: { toSceneId: string; yaw: number; pitch: number }[];
};

type Props = { token: string; propertyId: string; scenes: TourSceneInput[] };

/**
 * 360° tur: Photo Sphere Viewer + sanal tur eklentisi. Odalar "kapı" noktalarıyla bağlı,
 * telefonda jiroskop açık. Her oda değişiminde önceki odada kalınan süre kaydedilir.
 */
export function VirtualTour({ token, propertyId, scenes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let destroyed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      // Kütüphane yalnızca tarayıcıda yüklenir (window/WebGL ister)
      const [{ Viewer }, { VirtualTourPlugin }, { GyroscopePlugin }, { MarkersPlugin }] = await Promise.all([
        import("@photo-sphere-viewer/core"),
        import("@photo-sphere-viewer/virtual-tour-plugin"),
        import("@photo-sphere-viewer/gyroscope-plugin"),
        import("@photo-sphere-viewer/markers-plugin"),
      ]);
      if (destroyed) return;

      const viewer = new Viewer({
        container,
        navbar: ["zoom", "move", "gyroscope", "caption", "fullscreen"],
        lang: { zoom: "Yakınlaştır", move: "Hareket", gyroscope: "Jiroskop", fullscreen: "Tam ekran" } as never,
        plugins: [
          MarkersPlugin,
          GyroscopePlugin,
          VirtualTourPlugin.withConfig({
            positionMode: "manual",
            renderMode: "3d",
            startNodeId: scenes[0]?.id,
            nodes: scenes.map((s) => ({
              id: s.id,
              name: s.name,
              caption: s.name,
              panorama: s.panoramaUrl,
              links: s.links.map((l) => ({ nodeId: l.toSceneId, position: { yaw: l.yaw, pitch: l.pitch } })),
            })),
          }),
        ],
      });

      const tour = viewer.getPlugin(VirtualTourPlugin) as InstanceType<typeof VirtualTourPlugin>;
      let currentId = scenes[0]?.id;
      let enteredAt = Date.now();

      const flush = () => {
        if (!currentId) return;
        sendEvent(token, { kind: "SCENE_VIEW", propertyId, sceneId: currentId, durationMs: Date.now() - enteredAt });
      };

      tour.addEventListener("node-changed", (e) => {
        flush();
        currentId = e.node.id;
        enteredAt = Date.now();
      });
      window.addEventListener("pagehide", flush);

      cleanup = () => {
        flush();
        window.removeEventListener("pagehide", flush);
        viewer.destroy();
      };
    })();

    return () => {
      destroyed = true;
      cleanup?.();
    };
  }, [token, propertyId, scenes]);

  return <div ref={containerRef} className="h-full w-full" />;
}
