import { PropertyForm } from "./property-form";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Daire ekle</h1>
        <p className="text-sm text-muted-foreground">
          Fotoğraf ve 360° kareleri şimdilik URL olarak girilir; dosya yükleme bir sonraki adımda gelecek.
        </p>
      </div>
      <PropertyForm />
    </div>
  );
}
