import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { formatTL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/panel/page-header";
import { SpecList } from "@/components/room/spec-list";

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
    <div className="flex flex-col gap-8">
      <PageHeader title="Portföy" description={`${properties.length} daire. Her daire bir odaya eklenip müşteriye gönderilebilir.`}>
        <Button asChild>
          <Link href="/portfoy/yeni">Daire ekle</Link>
        </Button>
      </PageHeader>
      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz daire yok.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/portfoy/${p.id}`} className="group">
            <Card className="h-full overflow-hidden py-0 transition-shadow group-hover:shadow-float">
              <div className="relative aspect-[3/2] bg-muted">
                {p.photos[0] ? (
                  <Image src={p.photos[0].url} alt={p.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Fotoğraf yok · tıklayıp yükleyin</div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  <Badge variant="glass">{p.listingType === "RENT" ? "Kiralık" : "Satılık"}</Badge>
                  {p._count.scenes > 0 && <Badge variant="glass">360° · {p._count.scenes} oda</Badge>}
                </div>
              </div>
              <CardContent className="flex flex-col gap-2.5 py-4">
                <h2 className="font-display text-lg font-semibold leading-tight">{p.title}</h2>
                <div className="text-xl font-semibold tabular">
                  {formatTL(p.price)}
                  {p.listingType === "RENT" && <span className="text-sm font-normal text-muted-foreground"> / ay</span>}
                </div>
                <SpecList property={p} showLocation />
                <div className="flex flex-wrap gap-x-2 pt-1 text-xs text-muted-foreground">
                  <span>{p._count.roomItems} odada paylaşıldı</span>
                  {user.role === "OWNER" && <span>· {p.agent.name}</span>}
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
