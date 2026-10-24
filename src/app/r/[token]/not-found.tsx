import { BrandMark } from "@/components/brand";

export default function RoomNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <BrandMark className="text-brand-dark" size={40} />
      <h1 className="font-display text-2xl font-semibold">Bu link artık geçerli değil</h1>
      <p className="max-w-xs text-sm text-muted-foreground">Danışmanınızdan yeni bir link isteyebilirsiniz.</p>
    </main>
  );
}
