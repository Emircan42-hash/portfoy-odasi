import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roomScope } from "@/lib/scope";
import { updateAppointmentStatus } from "@/lib/actions/room";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/page-header";

const statusLabel = { REQUESTED: "Talep", CONFIRMED: "Onaylı", DONE: "Yapıldı", CANCELLED: "İptal" } as const;

export default async function AppointmentsPage() {
  const user = await requireUser();
  const appointments = await prisma.appointment.findMany({
    where: { room: roomScope(user) },
    include: { room: { select: { id: true, customerName: true } }, property: { select: { title: true } } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Randevular" description="Müşterilerin odadan istediği gösterimler. Onaylayın, yapıldı işaretleyin." />
      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Randevu yok.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card text-sm shadow-card">
          {appointments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="font-medium">{formatDateTime(a.startsAt)}</span>
              <Link href={`/odalar/${a.room.id}`} className="hover:underline">
                {a.room.customerName}
              </Link>
              <span className="text-muted-foreground">· {a.property.title}</span>
              {a.customerNote && <span className="text-muted-foreground">· &quot;{a.customerNote}&quot;</span>}
              <Badge className="ml-auto" variant={a.status === "CONFIRMED" ? "success" : "outline"}>
                {statusLabel[a.status]}
              </Badge>
              {a.status === "REQUESTED" && (
                <form action={updateAppointmentStatus} className="flex gap-1">
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" name="status" value="CONFIRMED" size="sm">
                    Onayla
                  </Button>
                  <Button type="submit" name="status" value="CANCELLED" size="sm" variant="ghost">
                    İptal
                  </Button>
                </form>
              )}
              {a.status === "CONFIRMED" && (
                <form action={updateAppointmentStatus}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" name="status" value="DONE" size="sm" variant="outline">
                    Yapıldı
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
