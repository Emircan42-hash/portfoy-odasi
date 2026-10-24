import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRoomByToken } from "@/lib/room-data";
import { Tracker } from "@/components/room/tracker";
import { VirtualTour, type TourSceneInput } from "@/components/tour/virtual-tour";
import { BrandMark } from "@/components/brand";
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
    <main className="flex h-dvh flex-col bg-brand-dark text-brand-dark-foreground">
      <Tracker token={token} kind="TOUR_VIEW" propertyId={propertyId} />
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Button asChild variant="ghost" size="sm" className="text-brand-dark-foreground hover:bg-white/10 hover:text-brand-dark-foreground">
          <Link href={`/r/${token}/${propertyId}`}>
            <ArrowLeft /> Daireye dön
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.property.title}</div>
          <div className="text-xs text-brand-dark-muted">
            {scenes.length} oda · sürükleyin ya da telefonu çevirin, kapı oklarıyla odadan odaya geçin
          </div>
        </div>
        <BrandMark className="text-brand-dark-soft" size={24} />
      </div>
      <div className="min-h-0 flex-1">
        <VirtualTour token={token} propertyId={propertyId} scenes={scenes} />
      </div>
    </main>
  );
}
