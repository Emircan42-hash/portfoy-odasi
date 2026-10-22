import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoomByToken } from "@/lib/room-data";
import { appUrl, formatTL } from "@/lib/utils";
import { Tracker } from "@/components/room/tracker";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ token: string }> };

// WhatsApp önizlemesi: başlık, açıklama ve ilk dairenin kapak fotoğrafı
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const room = await getRoomByToken(token);
  if (!room) return { title: "Oda bulunamadı" };
  const cover = room.items[0]?.property.photos[0]?.url;
  const title = `${room.agent.name} sizin için ${room.items.length} daire seçti`;
  return {
    title,
    description: room.note ?? `${room.customerName} için hazırlanan portföy odası`,
    openGraph: {
      title,
      description: room.note ?? undefined,
      url: appUrl(`/r/${token}`),
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function RoomPage({ params }: Props) {
  const { token } = await params;
  const room = await getRoomByToken(token);
  if (!room) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-16">
      <Tracker token={token} kind="ROOM_OPEN" />
      <header className="flex flex-col gap-1 pt-4">
        <p className="text-sm text-muted-foreground">{room.agent.office.name}</p>
        <h1 className="text-2xl font-semibold">Merhaba {room.customerName}</h1>
        {room.note && <p className="text-base text-muted-foreground">{room.note}</p>}
        <p className="text-sm text-muted-foreground">
          Danışmanınız: {room.agent.name}
          {room.agent.phone && (
            <>
              {" · "}
              <a className="underline" href={`https://wa.me/${room.agent.phone.replace(/\D/g, "")}`}>
                WhatsApp
              </a>
            </>
          )}
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {room.items.map(({ property: p, agentNote }) => (
          <li key={p.id}>
            <Link href={`/r/${token}/${p.id}`} className="block overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
              <div className="relative aspect-[3/2] bg-muted">
                {p.photos[0] && (
                  <Image src={p.photos[0].url} alt={p.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
                )}
                {p.scenes.length > 0 && (
                  <Badge className="absolute left-3 top-3 bg-black/70 text-white">360° gezilebilir</Badge>
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium leading-tight">{p.title}</h2>
                  <Badge variant={p.listingType === "RENT" ? "secondary" : "default"}>
                    {p.listingType === "RENT" ? "Kiralık" : "Satılık"}
                  </Badge>
                </div>
                <div className="text-lg font-semibold">
                  {formatTL(p.price)}
                  {p.listingType === "RENT" && <span className="text-sm font-normal text-muted-foreground"> / ay</span>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.roomsLabel}
                  {p.sqm ? ` · ${p.sqm} m²` : ""}
                  {p.floor != null ? ` · ${p.floor}. kat` : ""} · {p.district}
                  {p.neighborhood ? `, ${p.neighborhood}` : ""}
                </div>
                {agentNote && <p className="mt-1 text-sm italic text-muted-foreground">&quot;{agentNote}&quot;</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
