import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Rotate3d } from "lucide-react";
import { getRoomByToken } from "@/lib/room-data";
import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/utils";
import { Tracker } from "@/components/room/tracker";
import { ReactionBar } from "@/components/room/reaction-bar";
import { AppointmentForm } from "@/components/room/appointment-form";
import { CostCard } from "@/components/room/cost-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ token: string; propertyId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token, propertyId } = await params;
  const room = await getRoomByToken(token);
  const item = room?.items.find((i) => i.property.id === propertyId);
  if (!item) return { title: "Daire bulunamadı" };
  return {
    title: item.property.title,
    openGraph: { title: item.property.title, images: item.property.photos[0] ? [{ url: item.property.photos[0].url }] : undefined },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { token, propertyId } = await params;
  const room = await getRoomByToken(token);
  const item = room?.items.find((i) => i.property.id === propertyId);
  if (!room || !item) notFound();
  const p = item.property;

  const reactions = await prisma.reaction.findMany({
    where: { roomId: room.id, propertyId: p.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, kind: true, text: true, photoId: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-16">
      <Tracker token={token} kind="PROPERTY_VIEW" propertyId={p.id} />
      <div className="flex items-center justify-between pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/r/${token}`}>
            <ArrowLeft /> Tüm daireler
          </Link>
        </Button>
        {p.scenes.length > 0 && (
          <Button asChild>
            <Link href={`/r/${token}/${p.id}/tur`}>
              <Rotate3d /> Evin içinde gez
            </Link>
          </Button>
        )}
      </div>

      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold leading-tight">{p.title}</h1>
          <Badge variant={p.listingType === "RENT" ? "secondary" : "default"}>
            {p.listingType === "RENT" ? "Kiralık" : "Satılık"}
          </Badge>
        </div>
        <div className="text-xl font-semibold">
          {formatTL(p.price)}
          {p.listingType === "RENT" && <span className="text-sm font-normal text-muted-foreground"> / ay</span>}
        </div>
        <div className="text-sm text-muted-foreground">
          {p.roomsLabel}
          {p.sqm ? ` · ${p.sqm} m²` : ""}
          {p.floor != null ? ` · ${p.floor}. kat` : ""}
          {p.buildingAge != null ? ` · ${p.buildingAge} yaşında bina` : ""} · {p.district}
          {p.neighborhood ? `, ${p.neighborhood}` : ""}
        </div>
        {item.agentNote && <p className="text-sm italic text-muted-foreground">Danışman notu: &quot;{item.agentNote}&quot;</p>}
      </header>

      <ReactionBar token={token} propertyId={p.id} initial={reactions} />

      <section className="grid gap-3 sm:grid-cols-2">
        {p.photos.map((photo) => (
          <figure key={photo.id} className="flex flex-col gap-2">
            <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-muted">
              <Image src={photo.url} alt={photo.caption ?? p.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            </div>
            <figcaption className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{photo.caption}</span>
              <ReactionBar token={token} propertyId={p.id} photoId={photo.id} initial={reactions} compact />
            </figcaption>
          </figure>
        ))}
      </section>

      {p.description && <p className="text-base leading-relaxed">{p.description}</p>}

      <CostCard property={p} />

      <AppointmentForm token={token} propertyId={p.id} />
    </main>
  );
}
