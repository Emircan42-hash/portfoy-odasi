import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roomScope } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/page-header";

export default async function RoomsPage() {
  const user = await requireUser();
  const rooms = await prisma.room.findMany({
    where: roomScope(user),
    include: {
      agent: { select: { name: true } },
      _count: { select: { items: true, reactions: true, appointments: true, offers: true } },
      events: { where: { kind: "ROOM_OPEN" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Müşteri odaları" description="Her müşteriye bir link. Açılış, tepki, teklif ve randevu burada toplanır.">
        <Button asChild>
          <Link href="/odalar/yeni">Yeni oda linki</Link>
        </Button>
      </PageHeader>
      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz oda yok. İlk linki oluşturun.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Müşteri</th>
                {user.role === "OWNER" && <th className="p-3 font-medium">Danışman</th>}
                <th className="p-3 font-medium">Daire</th>
                <th className="p-3 font-medium">Tepki</th>
                <th className="p-3 font-medium">Teklif</th>
                <th className="p-3 font-medium">Randevu</th>
                <th className="p-3 font-medium">Son açılış</th>
                <th className="p-3 font-medium">Oluşturuldu</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/odalar/${r.id}`} className="font-medium hover:underline">
                      {r.customerName}
                    </Link>
                  </td>
                  {user.role === "OWNER" && <td className="p-3 text-muted-foreground">{r.agent.name}</td>}
                  <td className="p-3">{r._count.items}</td>
                  <td className="p-3">{r._count.reactions}</td>
                  <td className="p-3">{r._count.offers}</td>
                  <td className="p-3">{r._count.appointments}</td>
                  <td className="p-3">
                    {r.events[0] ? (
                      <Badge variant="success">{formatDateTime(r.events[0].createdAt)}</Badge>
                    ) : (
                      <Badge variant="outline">Açılmadı</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
