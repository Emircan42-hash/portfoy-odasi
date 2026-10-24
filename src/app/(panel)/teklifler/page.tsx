import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roomScope } from "@/lib/scope";
import { updateOfferStatus } from "@/lib/actions/room";
import { formatDateTime, formatTL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusLabel = { PENDING: "Bekliyor", ACCEPTED: "Kabul", REJECTED: "Ret" } as const;
const statusVariant = { PENDING: "outline", ACCEPTED: "success", REJECTED: "destructive" } as const;

export default async function OffersPage() {
  const user = await requireUser();
  const offers = await prisma.offer.findMany({
    where: { room: roomScope(user) },
    include: {
      room: { select: { id: true, customerName: true, agent: { select: { name: true } } } },
      property: { select: { title: true, price: true, listingType: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Teklifler</h1>
        <p className="text-sm text-muted-foreground">
          Müşterilerin odadan verdiği teklifler. Yalnız siz ve şirket sahibi görür; mülk sahibine siz iletirsiniz.
        </p>
      </div>
      {offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz teklif yok.</p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {offers.map((o) => {
            const diff = Math.round(((o.amount - o.property.price) / o.property.price) * 100);
            return (
              <li key={o.id} className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">
                    {formatTL(o.amount)}
                    {o.property.listingType === "RENT" && <span className="text-sm font-normal text-muted-foreground"> / ay</span>}
                  </span>
                  <span className={diff < 0 ? "text-destructive" : "text-emerald-700"}>
                    ({diff > 0 ? "+" : ""}
                    {diff}% · ilan {formatTL(o.property.price)})
                  </span>
                  <Badge className="ml-auto" variant={statusVariant[o.status]}>
                    {statusLabel[o.status]}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-2 text-muted-foreground">
                  <Link href={`/odalar/${o.room.id}`} className="font-medium text-foreground hover:underline">
                    {o.room.customerName}
                  </Link>
                  <span>· {o.property.title}</span>
                  {user.role === "OWNER" && <span>· {o.room.agent.name}</span>}
                  <span>· {formatDateTime(o.createdAt)}</span>
                </div>
                {o.note && <p>Müşteri: &quot;{o.note}&quot;</p>}
                {o.agentNote && <p className="text-muted-foreground">Not: {o.agentNote}</p>}
                {o.status === "PENDING" && (
                  <form action={updateOfferStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <Input name="agentNote" placeholder="İç not: mülk sahibine iletildi, 40 diyor" className="h-8 max-w-sm text-xs" />
                    <Button type="submit" name="status" value="ACCEPTED" size="sm">
                      Kabul edildi
                    </Button>
                    <Button type="submit" name="status" value="REJECTED" size="sm" variant="outline">
                      Reddedildi
                    </Button>
                    <Button type="submit" name="status" value="PENDING" size="sm" variant="ghost">
                      Sadece notu kaydet
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
