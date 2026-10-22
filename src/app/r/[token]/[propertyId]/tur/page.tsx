import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRoomByToken } from "@/lib/room-data";
import { Tracker } from "@/components/room/tracker";
import { VirtualTour, type TourSceneInput } from "@/components/tour/virtual-tour";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ token: string; propertyId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token, propertyId } = await params;
  const room = await getRoomByToken(token);
  const item = room?.items.find((i) => i.property.id === propertyId);
  return { title: item ? `${item.property.title} · 360° tur` : "Tur bulunamadı" };
}

export default async function TourPage({ params }: Props) {
  const { token, propertyId } = await params;
  const room = await getRoomByToken(token);
  const item = room?.items.find((i) => i.property.id === propertyId);
  if (!room || !item || item.property.scenes.length === 0) notFound();

  const scenes: TourSceneInput[] = item.property.scenes.map((s) => ({
    id: s.id,
    name: s.name,
    panoramaUrl: s.panoramaUrl,
    links: Array.isArray(s.links) ? (s.links as TourSceneInput["links"]) : [],
  }));

  return (
    <main className="flex h-dvh flex-col bg-black text-white">
      <Tracker token={token} kind="TOUR_VIEW" propertyId={propertyId} />
      <div className="flex items-center gap-3 p-3">
        <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
          <Link href={`/r/${token}/${propertyId}`}>
            <ArrowLeft /> Daireye dön
          </Link>
        </Button>
        <span className="truncate text-sm">{item.property.title}</span>
      </div>
      <div className="min-h-0 flex-1">
        <VirtualTour token={token} propertyId={propertyId} scenes={scenes} />
      </div>
    </main>
  );
}
