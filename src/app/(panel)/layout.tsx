import Link from "next/link";
import { Building2, CalendarClock, DoorOpen, LayoutDashboard, LogOut } from "lucide-react";
import { requireUser } from "@/auth";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/panel", label: "Özet", icon: LayoutDashboard },
  { href: "/portfoy", label: "Portföy", icon: Building2 },
  { href: "/odalar", label: "Müşteri odaları", icon: DoorOpen },
  { href: "/randevular", label: "Randevular", icon: CalendarClock },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/30 p-4 md:flex">
        <Link href="/panel" className="text-lg font-semibold">
          Portföy Odası
        </Link>
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-sm">
          <div>
            <div className="font-medium">{user.name}</div>
            <Badge variant="secondary" className="mt-1">
              {user.role === "OWNER" ? "Şirket sahibi" : "Danışman"}
            </Badge>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut /> Çıkış
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <Link href="/panel" className="font-semibold">
            Portföy Odası
          </Link>
          <nav className="ml-auto flex gap-3 text-sm">
            {nav.map(({ href, label }) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
