import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { RoomForm } from "./room-form";

export default async function NewRoomPage() {
  const user = await requireUser();
  const properties = await prisma.property.findMany({
    where: propertyScope(user),
    select: { id: true, title: true, listingType: true, price: true, roomsLabel: true, district: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Yeni oda linki</h1>
        <p className="text-sm text-muted-foreground">
          Müşteri için daireleri seçin; tek bir link üretilir, WhatsApp&apos;tan gönderirsiniz.
        </p>
      </div>
      <RoomForm properties={properties} />
    </div>
  );
}
