import { BedDouble, Building2, CalendarRange, MapPin, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  property: {
    roomsLabel: string;
    sqm: number | null;
    floor: number | null;
    buildingAge: number | null;
    district: string;
    neighborhood: string | null;
  };
  className?: string;
  showLocation?: boolean;
};

/** Oda, metrekare, kat, bina yaşı; ikonlu, tek satırda akar. */
export function SpecList({ property: p, className, showLocation = false }: Props) {
  const items = [
    { icon: BedDouble, text: p.roomsLabel },
    p.sqm ? { icon: Ruler, text: `${p.sqm} m²` } : null,
    p.floor != null ? { icon: Building2, text: `${p.floor}. kat` } : null,
    p.buildingAge != null ? { icon: CalendarRange, text: `${p.buildingAge} yaşında` } : null,
    showLocation ? { icon: MapPin, text: p.neighborhood ? `${p.neighborhood}, ${p.district}` : p.district } : null,
  ].filter((i): i is { icon: typeof BedDouble; text: string } => i !== null);

  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground", className)}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="inline-flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 opacity-70" />
          {text}
        </li>
      ))}
    </ul>
  );
}
