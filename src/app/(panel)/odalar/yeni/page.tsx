import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import { RoomForm } from "./room-form";
import { PageHeader } from "@/components/panel/page-header";

export default async function NewRoomPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property: preselect } = await searchParams;
  const user = await requireUser();
  const properties = await prisma.property.findMany({
    where: propertyScope(user),
    select: { id: true, title: true, listingType: true, price: true, roomsLabel: true, district: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader title="Yeni oda linki" description="Müşteri için daireleri seçin; tek bir link üretilir, WhatsApp'tan gönderirsiniz." />
      <div className="rounded-2xl border bg-card p-5 shadow-card md:p-6">
        <RoomForm properties={properties} preselect={preselect} />
      </div>
    </div>
  );
}
