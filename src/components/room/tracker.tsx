"use client";

import { useEffect } from "react";

type Props = {
  token: string;
  kind: "ROOM_OPEN" | "PROPERTY_VIEW" | "TOUR_VIEW";
  propertyId?: string;
};

// Aynı olayın saniyeler içinde iki kez gitmesini önler (React StrictMode dev'de effect'leri iki kez çalıştırır).
const recentlySent = new Map<string, number>();

export function sendEvent(token: string, body: Record<string, unknown>) {
  const durationMs = typeof body.durationMs === "number" ? body.durationMs : undefined;
  // Bir saniyenin altındaki bakışlar gürültüdür (sayfa geçişi, StrictMode yeniden bağlanması)
  if (durationMs !== undefined && durationMs < 1000) return;
  const key = `${token}:${body.kind}:${body.propertyId ?? ""}:${body.sceneId ?? ""}`;
  const now = Date.now();
  if (durationMs === undefined && now - (recentlySent.get(key) ?? 0) < 2000) return;
  recentlySent.set(key, now);

  const url = `/api/r/${token}/events`;
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
  if (navigator.sendBeacon?.(url, blob)) return;
  void fetch(url, { method: "POST", body: blob, keepalive: true });
}

/**
 * Müşteri hareketini kaydeder. ROOM_OPEN ve TOUR_VIEW açılışta bir kez gider;
 * PROPERTY_VIEW sayfadan çıkarken, kalınan süreyle gider.
 */
export function Tracker({ token, kind, propertyId }: Props) {
  useEffect(() => {
    if (kind !== "PROPERTY_VIEW") {
      sendEvent(token, { kind, propertyId });
      return;
    }
    const startedAt = Date.now();
    let sent = false;
    const flush = () => {
      if (sent) return;
      sent = true;
      sendEvent(token, { kind, propertyId, durationMs: Date.now() - startedAt });
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [token, kind, propertyId]);

  return null;
}
