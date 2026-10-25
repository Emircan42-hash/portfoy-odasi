import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Rotate3d } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { formatTL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SpecList } from "@/components/room/spec-list";
import { PhotoManager, SceneManager } from "@/components/panel/media-manager";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const p = await prisma.property.findFirst({
    where: { id, ...propertyScope(user) },
    include: {
      photos: { orderBy: { order: "asc" } },
      scenes: { orderBy: { order: "asc" } },
      agent: { select: { name: true } },
      _count: { select: { roomItems: true } },
    },
  });
  if (!p) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/portfoy">
            <ArrowLeft /> Portföy
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{p.title}</h1>
              <Badge variant={p.listingType === "RENT" ? "secondary" : "default"}>{p.listingType === "RENT" ? "Kiralık" : "Satılık"}</Badge>
            </div>
            <div className="text-xl font-semibold tabular">
              {formatTL(p.price)}
              {p.listingType === "RENT" && <span className="text-sm font-normal text-muted-foreground"> / ay</span>}
            </div>
            <SpecList property={p} showLocation />
            <p className="text-xs text-muted-foreground">
              {p.agent.name} · {p._count.roomItems} odada paylaşıldı
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/odalar/yeni?property=${p.id}`}>Müşteriye gönder</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Fotoğraflar</CardTitle>
          <CardDescription>Müşteri odasında bu sırayla görünür; ilk fotoğraf kapak ve WhatsApp önizlemesidir.</CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoManager propertyId={p.id} photos={p.photos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display text-xl">360° tur</CardTitle>
              <CardDescription>Her oda için bir kare. İlk kare turun başladığı odadır; kareler yüklenince kapıları yerleştirin.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {p.scenes.length > 0 && (
                <Badge variant="outline">
                  <Rotate3d className="size-3" /> {p.scenes.length} oda · {p.scenes.reduce((n, s) => n + (Array.isArray(s.links) ? s.links.length : 0), 0)} kapı
                </Badge>
              )}
              {p.scenes.length >= 2 && (
                <Button asChild size="sm">
                  <Link href={`/portfoy/${p.id}/tur`}>Kapıları yerleştir</Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SceneManager propertyId={p.id} scenes={p.scenes} />
        </CardContent>
      </Card>
    </div>
  );
}
