import Link from "next/link";
import { Building2, CalendarClock, DoorOpen, Eye, HandCoins, type LucideIcon } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope, roomScope } from "@/lib/scope";
import { daysAgo, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/page-header";

type Stat = { label: string; value: number; href: string; icon: LucideIcon; highlight?: boolean };

export default async function DashboardPage() {
  const user = await requireUser();
  const since = daysAgo(7);

  const [properties, rooms, opensThisWeek, appointments, pendingOffers, recentEvents] = await Promise.all([
    prisma.property.count({ where: propertyScope(user) }),
    prisma.room.count({ where: roomScope(user) }),
    prisma.roomEvent.count({ where: { kind: "ROOM_OPEN", createdAt: { gte: since }, room: roomScope(user) } }),
    prisma.appointment.count({ where: { status: "REQUESTED", room: roomScope(user) } }),
    prisma.offer.count({ where: { status: "PENDING", room: roomScope(user) } }),
    prisma.roomEvent.findMany({
      where: { room: roomScope(user), kind: { in: ["ROOM_OPEN", "PROPERTY_VIEW", "TOUR_VIEW"] } },
      include: { room: { select: { id: true, customerName: true } }, property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats: Stat[] = [
    { label: "Portföy", value: properties, href: "/portfoy", icon: Building2 },
    { label: "Müşteri odası", value: rooms, href: "/odalar", icon: DoorOpen },
    { label: "Bu hafta açılan link", value: opensThisWeek, href: "/odalar", icon: Eye },
    { label: "Bekleyen teklif", value: pendingOffers, href: "/teklifler", icon: HandCoins, highlight: pendingOffers > 0 },
    { label: "Bekleyen randevu", value: appointments, href: "/randevular", icon: CalendarClock, highlight: appointments > 0 },
  ];

  const kindLabel = { ROOM_OPEN: "linki açtı", PROPERTY_VIEW: "daireye baktı", TOUR_VIEW: "turu açtı" } as const;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Özet" description={`${user.name}, müşterilerinin odalarda ne yaptığı burada.`}>
        <Button asChild>
          <Link href="/odalar/yeni">Yeni oda linki</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, href, icon: Icon, highlight }) => (
          <Link key={label} href={href} className="group">
            <Card className="h-full gap-3 py-4 transition-shadow group-hover:shadow-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardDescription>{label}</CardDescription>
                <span className={`flex size-8 items-center justify-center rounded-full ${highlight ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-semibold tabular">{value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Son hareketler</CardTitle>
          <CardDescription>Müşterilerin odalarda yaptıkları, en yeni üstte.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz hareket yok. Bir oda linki gönderin.</p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {recentEvents.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-2 py-2.5">
                  <Link href={`/odalar/${e.room.id}`} className="font-medium hover:underline">
                    {e.room.customerName}
                  </Link>
                  <span>{kindLabel[e.kind as keyof typeof kindLabel]}</span>
                  {e.property && <span className="text-muted-foreground">· {e.property.title}</span>}
                  <span className="ml-auto text-muted-foreground tabular">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
