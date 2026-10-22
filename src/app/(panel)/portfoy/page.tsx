import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { formatTL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function PropertiesPage() {
  const user = await requireUser();
  const properties = await prisma.property.findMany({
    where: propertyScope(user),
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      agent: { select: { name: true } },
      _count: { select: { scenes: true, roomItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Portföy</h1>
        <Button asChild>
          <Link href="/portfoy/yeni">Daire ekle</Link>
        </Button>
      </div>
      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz daire yok.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="overflow-hidden py-0">
              <div className="relative aspect-[3/2] bg-muted">
                {p.photos[0] && (
                  <Image src={p.photos[0].url} alt={p.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                )}
              </div>
              <CardContent className="flex flex-col gap-2 pb-4">
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
                  {p.roomsLabel} · {p.sqm ? `${p.sqm} m² · ` : ""}
                  {p.district}
                  {p.neighborhood ? `, ${p.neighborhood}` : ""}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {p._count.scenes > 0 && <Badge variant="outline">360° tur · {p._count.scenes} oda</Badge>}
                  <span>{p._count.roomItems} odada paylaşıldı</span>
                  {user.role === "OWNER" && <span>· {p.agent.name}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
