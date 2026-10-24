import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, MapPin, Rotate3d } from "lucide-react";
import { getRoomByToken } from "@/lib/room-data";
import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/utils";
import { Tracker } from "@/components/room/tracker";
import { ReactionBar } from "@/components/room/reaction-bar";
import { AppointmentForm } from "@/components/room/appointment-form";
import { OfferForm } from "@/components/room/offer-form";
import { CostCard } from "@/components/room/cost-card";
import { SpecList } from "@/components/room/spec-list";
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

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-xl font-semibold">{children}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default async function PropertyPage({ params }: Props) {
  const { token, propertyId } = await params;
  const room = await getRoomByToken(token);
  const item = room?.items.find((i) => i.property.id === propertyId);
  if (!room || !item) notFound();
  const p = item.property;
  const [cover, ...rest] = p.photos;
  const hasTour = p.scenes.length > 0;

  const [reactions, offerCount] = await Promise.all([
    prisma.reaction.findMany({
      where: { roomId: room.id, propertyId: p.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, kind: true, text: true, photoId: true },
    }),
    // Müşteriye yalnız "teklif verildi mi" bilgisi gider, tutar asla gitmez
    prisma.offer.count({ where: { roomId: room.id, propertyId: p.id } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-28 pt-3 md:pb-16">
      <Tracker token={token} kind="PROPERTY_VIEW" propertyId={p.id} />

      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/r/${token}`}>
            <ArrowLeft /> Tüm daireler
          </Link>
        </Button>
        {hasTour && (
          <Button asChild className="hidden md:inline-flex">
            <Link href={`/r/${token}/${p.id}/tur`}>
              <Rotate3d /> Evin içinde gez
            </Link>
          </Button>
        )}
      </div>

      {cover && (
        <figure className="flex flex-col gap-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted shadow-card">
            <Image src={cover.url} alt={cover.caption ?? p.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge variant="glass">{p.listingType === "RENT" ? "Kiralık" : "Satılık"}</Badge>
              {hasTour && (
                <Badge variant="glass">
                  <Rotate3d /> 360°
                </Badge>
              )}
            </div>
          </div>
          <figcaption className="flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">{cover.caption}</span>
            <ReactionBar token={token} propertyId={p.id} photoId={cover.id} initial={reactions} compact />
          </figcaption>
        </figure>
      )}

      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[2rem] font-semibold leading-[1.1]">{p.title}</h1>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 opacity-70" />
            {p.neighborhood ? `${p.neighborhood}, ` : ""}
            {p.district}, {p.city}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-3xl font-semibold leading-none tabular">
            {formatTL(p.price)}
            {p.listingType === "RENT" && <span className="text-base font-normal text-muted-foreground"> / ay</span>}
          </div>
          <SpecList property={p} />
        </div>
        {item.agentNote && (
          <p className="border-l-2 border-primary pl-3 text-sm italic text-foreground/80">
            {room.agent.name.split(" ")[0]}: &quot;{item.agentNote}&quot;
          </p>
        )}
        <ReactionBar token={token} propertyId={p.id} initial={reactions} />
      </header>

      {rest.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle hint="Fotoğrafa tepki verin, danışmanınız görür">Fotoğraflar</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((photo) => (
              <figure key={photo.id} className="flex flex-col gap-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <Image src={photo.url} alt={photo.caption ?? p.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                </div>
                <figcaption className="flex items-center justify-between px-1 text-sm">
                  <span className="text-muted-foreground">{photo.caption}</span>
                  <ReactionBar token={token} propertyId={p.id} photoId={photo.id} initial={reactions} compact />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {p.description && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Daire hakkında</SectionTitle>
          <p className="text-[15px] leading-relaxed">{p.description}</p>
        </section>
      )}

      <CostCard property={p} />

      <section id="teklif" className="scroll-mt-4">
        <OfferForm token={token} propertyId={p.id} listingType={p.listingType} alreadyOffered={offerCount > 0} />
      </section>

      <section id="randevu" className="scroll-mt-4">
        <AppointmentForm token={token} propertyId={p.id} />
      </section>

      {/* Telefonda alt çubuk: tur ve randevu her an elin altında */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          {hasTour && (
            <Button asChild size="lg" className="flex-1">
              <Link href={`/r/${token}/${p.id}/tur`}>
                <Rotate3d /> Evin içinde gez
              </Link>
            </Button>
          )}
          <Button asChild size="lg" variant={hasTour ? "outline" : "default"} className="flex-1">
            <a href="#randevu">
              <CalendarCheck /> Randevu iste
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
