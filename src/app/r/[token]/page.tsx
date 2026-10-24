import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Rotate3d } from "lucide-react";
import { getRoomByToken } from "@/lib/room-data";
import { appUrl, formatTL } from "@/lib/utils";
import { Tracker } from "@/components/room/tracker";
import { SpecList } from "@/components/room/spec-list";
import { BrandMark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

export default async function RoomPage({ params }: Props) {
  const { token } = await params;
  const room = await getRoomByToken(token);
  if (!room) notFound();
  const wa = room.agent.phone ? `https://wa.me/${room.agent.phone.replace(/\D/g, "")}` : null;

  return (
    <main className="flex min-h-dvh flex-col">
      <Tracker token={token} kind="ROOM_OPEN" />

      <header className="relative overflow-hidden bg-brand-dark text-brand-dark-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--brand-glow), transparent)" }}
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-7">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-dark-muted">{room.agent.office.name}</span>
            <BrandMark className="text-brand-dark-soft" size={26} />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02]">Merhaba {room.customerName}</h1>
            {room.note && <p className="max-w-prose text-[15px] leading-relaxed text-brand-dark-muted">{room.note}</p>}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-glow/25 text-sm font-semibold">
              {initials(room.agent.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{room.agent.name}</div>
              <div className="text-xs text-brand-dark-muted">Danışmanınız</div>
            </div>
            {wa && (
              <Button asChild variant="whatsapp" size="sm" className="rounded-full">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
            )}
          </div>
          <p className="text-xs text-brand-dark-muted">
            Sizin için seçilen {room.items.length} daire. Beğendiklerinizi işaretleyin, not bırakın; {room.agent.name.split(" ")[0]} anında görür.
          </p>
        </div>
      </header>

      <section className="mx-auto -mt-10 flex w-full max-w-3xl flex-col gap-5 px-4 pb-16">
        {room.items.map(({ property: p, agentNote }) => (
          <Link
            key={p.id}
            href={`/r/${token}/${p.id}`}
            className="group block overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/60 transition-shadow hover:shadow-float"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {p.photos[0] && (
                <Image
                  src={p.photos[0].url}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  priority
                />
              )}
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute left-3 top-3 flex gap-2">
                <Badge variant="glass">{p.listingType === "RENT" ? "Kiralık" : "Satılık"}</Badge>
                {p.scenes.length > 0 && (
                  <Badge variant="glass">
                    <Rotate3d /> 360° gezilebilir
                  </Badge>
                )}
              </div>
              <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
                <div className="text-[1.65rem] font-semibold leading-none tabular">
                  {formatTL(p.price)}
                  {p.listingType === "RENT" && <span className="text-sm font-normal opacity-80"> / ay</span>}
                </div>
                <span className="inline-flex items-center gap-1 text-xs opacity-85">
                  <MapPin className="size-3.5" />
                  {p.neighborhood ?? p.district}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4 pb-5">
              <h2 className="font-display text-[1.35rem] font-semibold leading-tight">{p.title}</h2>
              <SpecList property={p} />
              {agentNote && <p className="border-l-2 border-primary pl-3 text-sm italic text-foreground/80">&quot;{agentNote}&quot;</p>}
            </div>
          </Link>
        ))}

        <footer className="flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground">
          <BrandMark className="text-brand-dark" size={16} /> Portföy Odası ile hazırlandı
        </footer>
      </section>
    </main>
  );
}
