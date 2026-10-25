import type { NotificationKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/utils";

export type NotifyInput = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
};

/**
 * Danışmana bildirim: her zaman panel içi kayıt; NOTIFY_WEBHOOK_URL tanımlıysa
 * aynı içerik JSON olarak dışarı POST edilir (n8n, Netgsm/Twilio köprüsü, WhatsApp Business vb.).
 * Dış iletim arka planda ve hata yutarak çalışır; müşteri isteğini asla bekletmez.
 */
export async function notify(input: NotifyInput) {
  const row = await prisma.notification.create({ data: input });

  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (url) {
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { name: true, phone: true, email: true } });
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.NOTIFY_WEBHOOK_SECRET ? { "x-notify-secret": process.env.NOTIFY_WEBHOOK_SECRET } : {}) },
      body: JSON.stringify({
        id: row.id,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        url: input.href ? appUrl(input.href) : null,
        to: user ? { name: user.name, phone: user.phone, email: user.email } : null,
        at: row.createdAt.toISOString(),
      }),
    })
      .then((res) => {
        if (!res.ok) console.warn(`[notify] webhook ${res.status}: ${url}`);
      })
      .catch((err: unknown) => console.warn(`[notify] webhook ulaşılamadı: ${url}`, err instanceof Error ? err.message : err));
  }

  return row;
}
