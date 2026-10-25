import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";
import { NavLinks } from "@/components/panel/nav-links";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const roleLabel = user.role === "OWNER" ? "Şirket sahibi" : "Danışman";
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-dark p-5 text-brand-dark-foreground md:flex">
        <Link href="/panel" className="px-1">
          <Wordmark inverted />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLinks unread={unread} />
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-glow/25 text-sm font-semibold text-brand-dark-foreground">
              {initials(user.name ?? "")}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="text-xs text-brand-dark-muted">{roleLabel}</div>
            </div>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-brand-dark-muted hover:bg-white/5 hover:text-brand-dark-foreground"
            >
              <LogOut /> Çıkış
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-col gap-2 bg-brand-dark px-4 py-3 text-brand-dark-foreground md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/panel">
              <Wordmark inverted />
            </Link>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" className="text-brand-dark-muted hover:bg-white/5 hover:text-brand-dark-foreground" aria-label="Çıkış">
                <LogOut />
              </Button>
            </form>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            <NavLinks compact unread={unread} />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
