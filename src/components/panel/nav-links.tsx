"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarClock, DoorOpen, HandCoins, LayoutDashboard, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// İkonlar istemci tarafında kalır; sunucu layout'u fonksiyon geçiremez
const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/panel", label: "Özet", icon: LayoutDashboard },
  { href: "/portfoy", label: "Portföy", icon: Building2 },
  { href: "/odalar", label: "Müşteri odaları", icon: DoorOpen },
  { href: "/teklifler", label: "Teklifler", icon: HandCoins },
  { href: "/randevular", label: "Randevular", icon: CalendarClock },
];

export function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg text-sm whitespace-nowrap transition-colors",
              compact ? "px-2.5 py-1.5" : "px-3 py-2",
              active
                ? "bg-white/10 font-medium text-brand-dark-foreground"
                : "text-brand-dark-muted hover:bg-white/5 hover:text-brand-dark-foreground",
            )}
          >
            <Icon className={cn("size-4", active ? "text-brand-glow" : "")} />
            {label}
          </Link>
        );
      })}
    </>
  );
}
