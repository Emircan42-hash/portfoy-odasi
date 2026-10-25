import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyScope } from "@/lib/scope";
import type { SceneLink } from "@/lib/actions/tour";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/page-header";
import { TourEditor } from "@/components/panel/tour-editor";

export default async function TourEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const p = await prisma.property.findFirst({
    where: { id, ...propertyScope(user) },
    include: { scenes: { orderBy: { order: "asc" } } },
  });
  if (!p) notFound();

  const scenes = p.scenes.map((s) => ({
    id: s.id,
    name: s.name,
    panoramaUrl: s.panoramaUrl,
    links: Array.isArray(s.links) ? (s.links as SceneLink[]) : [],
  }));

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={`/portfoy/${p.id}`}>
          <ArrowLeft /> {p.title}
        </Link>
      </Button>
      <PageHeader
        title="Kapı noktaları"
        description="Müşteri turda bu oklara tıklayarak odadan odaya geçer. Her odada diğer odalara açılan kapıları işaretleyin."
      />
      <TourEditor scenes={scenes} />
    </div>
  );
}
