import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

const nav = [
  { href: "/animes", label: "Animes" },
  { href: "/temporada", label: "Temporada" },
  { href: "/top", label: "Top" },
  { href: "/forum", label: "Fórum" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          anima<span className="text-primary">list</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2.5 py-1.5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          action="/animes"
          className="relative ml-auto w-full max-w-64 min-w-24"
        >
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar anime…"
            aria-label="Buscar anime"
            className="pl-8"
          />
        </form>

        <ThemeToggle />

        {/* a sessão é lida na requisição, então fica atrás de um Suspense */}
        <Suspense fallback={<div className="bg-muted size-8 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </div>

      {/* no celular os links vão para uma segunda linha */}
      <nav className="flex gap-1 overflow-x-auto border-t px-2 py-1 text-sm md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md px-2.5 py-1.5"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
