import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roomScope } from "@/lib/scope";
import { appUrl, formatDateTime, formatDuration, formatTL } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";

const reactionLabel = { LIKE: "Beğendi", DISLIKE: "Elemek istedi", NOTE: "Not" } as const;
const statusLabel = { REQUESTED: "Talep", CONFIRMED: "Onaylı", DONE: "Yapıldı", CANCELLED: "İptal" } as const;
const offerLabel = { PENDING: "Bekliyor", ACCEPTED: "Kabul", REJECTED: "Ret" } as const;

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const room = await prisma.room.findFirst({
    where: { id, ...roomScope(user) },
    include: {
      agent: { select: { name: true, phone: true } },
      items: {
        orderBy: { order: "asc" },
        include: {
          property: {
            include: {
              photos: { orderBy: { order: "asc" }, take: 1 },
              _count: { select: { scenes: true } },
            },
          },
        },
      },
      events: { orderBy: { createdAt: "desc" } },
      reactions: { orderBy: { createdAt: "desc" }, include: { photo: true, scene: true } },
      offers: { orderBy: { createdAt: "desc" } },
      appointments: { orderBy: { startsAt: "asc" }, include: { property: { select: { title: true } } } },
    },
  });
  if (!room) notFound();

  const link = appUrl(`/r/${room.token}`);
  const waText = `Merhaba ${room.customerName}, sizin için seçtiğim daireler burada: ${link}`;
  const waHref = `https://wa.me/${(room.customerPhone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`;

  const opens = room.events.filter((e) => e.kind === "ROOM_OPEN");
  const statsByProperty = new Map<string, { views: number; durationMs: number; tourViews: number }>();
  for (const e of room.events) {
    if (!e.propertyId) continue;
    const s = statsByProperty.get(e.propertyId) ?? { views: 0, durationMs: 0, tourViews: 0 };
    if (e.kind === "PROPERTY_VIEW") {
      s.views += 1;
      s.durationMs += e.durationMs ?? 0;
    }
    if (e.kind === "TOUR_VIEW") s.tourViews += 1;
    statsByProperty.set(e.propertyId, s);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{room.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            {room.agent.name} · oluşturuldu {formatDateTime(room.createdAt)}
            {opens.length > 0 ? ` · ${opens.length} kez açıldı, son ${formatDateTime(opens[0].createdAt)}` : " · henüz açılmadı"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={link} />
          <Button asChild variant="secondary">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              WhatsApp&apos;tan gönder
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/r/${room.token}`} target="_blank">
              Müşteri gözüyle aç
            </Link>
          </Button>
        </div>
      </div>

      <code className="w-fit rounded-md bg-muted px-3 py-2 text-sm">{link}</code>

      <section className="grid gap-4 lg:grid-cols-2">
        {room.items.map(({ property: p, agentNote }) => {
          const s = statsByProperty.get(p.id);
          const reactions = room.reactions.filter((r) => r.propertyId === p.id);
          const offers = room.offers.filter((o) => o.propertyId === p.id);
          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{p.title}</CardTitle>
                  <Badge variant={p.listingType === "RENT" ? "secondary" : "default"}>
                    {p.listingType === "RENT" ? "Kiralık" : "Satılık"}
                  </Badge>
                </div>
                <CardDescription>
                  {formatTL(p.price)}
                  {p.listingType === "RENT" ? " / ay" : ""} · {p.roomsLabel} · {p.district}
                  {agentNote ? ` · not: "${agentNote}"` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{s?.views ?? 0} görüntüleme</Badge>
                  <Badge variant="outline">{formatDuration(s?.durationMs ?? 0)} bakıldı</Badge>
                  {p._count.scenes > 0 && <Badge variant="outline">{s?.tourViews ?? 0} tur açılışı</Badge>}
                </div>
                {reactions.length === 0 ? (
                  <p className="text-muted-foreground">Tepki yok.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {reactions.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-baseline gap-x-2">
                        <Badge variant={r.kind === "LIKE" ? "success" : r.kind === "DISLIKE" ? "destructive" : "secondary"}>
                          {reactionLabel[r.kind]}
                        </Badge>
                        {r.photo?.caption && <span className="text-muted-foreground">{r.photo.caption}</span>}
                        {r.scene?.name && <span className="text-muted-foreground">{r.scene.name} (360°)</span>}
                        {r.text && <span>&quot;{r.text}&quot;</span>}
                        <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {offers.length > 0 && (
                  <ul className="flex flex-col gap-1 border-t pt-2">
                    {offers.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-baseline gap-x-2">
                        <Badge variant={o.status === "ACCEPTED" ? "success" : o.status === "REJECTED" ? "destructive" : "outline"}>
                          Teklif · {offerLabel[o.status]}
                        </Badge>
                        <span className="font-medium">
                          {formatTL(o.amount)}
                          {p.listingType === "RENT" ? " / ay" : ""}
                        </span>
                        {o.note && <span className="text-muted-foreground">&quot;{o.note}&quot;</span>}
                        <Link href="/teklifler" className="ml-auto text-xs text-muted-foreground hover:underline">
                          {formatDateTime(o.createdAt)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Randevular</CardTitle>
        </CardHeader>
        <CardContent>
          {room.appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Randevu talebi yok.</p>
          ) : (
            <ul className="divide-y text-sm">
              {room.appointments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="font-medium">{formatDateTime(a.startsAt)}</span>
                  <span className="text-muted-foreground">· {a.property.title}</span>
                  {a.customerNote && <span className="text-muted-foreground">· &quot;{a.customerNote}&quot;</span>}
                  <Badge className="ml-auto" variant={a.status === "CONFIRMED" ? "success" : "outline"}>
                    {statusLabel[a.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
