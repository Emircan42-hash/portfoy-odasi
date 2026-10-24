import { PropertyForm } from "./property-form";
import { PageHeader } from "@/components/panel/page-header";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader
        title="Daire ekle"
        description="Fotoğraf ve 360° kareleri şimdilik URL olarak girilir; dosya yükleme bir sonraki adımda gelecek."
      />
      <div className="rounded-2xl border bg-card p-5 shadow-card md:p-6">
        <PropertyForm />
      </div>
    </div>
  );
}
