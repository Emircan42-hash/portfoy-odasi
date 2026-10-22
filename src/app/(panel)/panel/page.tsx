import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope, roomScope } from "@/lib/scope";
import { daysAgo, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();
  const since = daysAgo(7);

  const [properties, rooms, opensThisWeek, appointments, recentEvents] = await Promise.all([
    prisma.property.count({ where: propertyScope(user) }),
    prisma.room.count({ where: roomScope(user) }),
    prisma.roomEvent.count({ where: { kind: "ROOM_OPEN", createdAt: { gte: since }, room: roomScope(user) } }),
    prisma.appointment.count({ where: { status: "REQUESTED", room: roomScope(user) } }),
    prisma.roomEvent.findMany({
      where: { room: roomScope(user), kind: { in: ["ROOM_OPEN", "PROPERTY_VIEW", "TOUR_VIEW"] } },
      include: { room: { select: { id: true, customerName: true } }, property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = [
    { label: "Portföy", value: properties, href: "/portfoy" },
    { label: "Müşteri odası", value: rooms, href: "/odalar" },
    { label: "Bu hafta açılan link", value: opensThisWeek, href: "/odalar" },
    { label: "Bekleyen randevu", value: appointments, href: "/randevular" },
  ];

  const kindLabel = { ROOM_OPEN: "linki açtı", PROPERTY_VIEW: "daireye baktı", TOUR_VIEW: "turu açtı" } as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Özet</h1>
        <Button asChild>
          <Link href="/odalar/yeni">Yeni oda linki</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card>
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Son hareketler</CardTitle>
          <CardDescription>Müşterilerin odalarda yaptıkları, en yeni üstte.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz hareket yok. Bir oda linki gönderin.</p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {recentEvents.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-2 py-2">
                  <Link href={`/odalar/${e.room.id}`} className="font-medium hover:underline">
                    {e.room.customerName}
                  </Link>
                  <span>{kindLabel[e.kind as keyof typeof kindLabel]}</span>
                  {e.property && <span className="text-muted-foreground">· {e.property.title}</span>}
                  <span className="ml-auto text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
