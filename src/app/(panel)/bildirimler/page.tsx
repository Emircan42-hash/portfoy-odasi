import Link from "next/link";
import { Bell, CalendarClock, DoorOpen, HandCoins, MessageSquareText, type LucideIcon } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/panel/page-header";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  OFFER: HandCoins,
  APPOINTMENT: CalendarClock,
  NOTE: MessageSquareText,
  ROOM_OPEN: DoorOpen,
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  // Sayfa görüldüğünde hepsi okunmuş sayılır; listede yenileri yine vurgulu gösteririz
  const unreadIds = items.filter((n) => !n.readAt).map((n) => n.id);
  if (unreadIds.length > 0) {
    await prisma.notification.updateMany({ where: { id: { in: unreadIds } }, data: { readAt: new Date() } });
  }

  const webhook = Boolean(process.env.NOTIFY_WEBHOOK_URL);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bildirimler"
        description={
          webhook
            ? "Teklif, randevu, not ve ilk açılışlar. Aynı anda dış kanala da iletiliyor."
            : "Teklif, randevu, not ve ilk açılışlar. SMS/WhatsApp iletimi için .env'de NOTIFY_WEBHOOK_URL tanımlanır."
        }
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz bildirim yok. Bir müşteri linki açınca burada görünür.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card shadow-card">
          {items.map((n) => {
            const Icon = icons[n.kind] ?? Bell;
            const fresh = unreadIds.includes(n.id);
            return (
              <li key={n.id} className={cn("flex items-start gap-3 p-4", fresh && "bg-accent/40")}>
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", fresh ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  {n.href ? (
                    <Link href={n.href} className="font-medium hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{n.title}</span>
                  )}
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular">{formatDateTime(n.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
