import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Paginação por link (?pagina=N), preservando os outros parâmetros da URL.
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (value) search.set(key, value);
    if (target > 1) search.set("pagina", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Paginação"
    >
      <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}>
        <Link
          href={href(page - 1)}
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
        >
          <ChevronLeftIcon /> Anterior
        </Link>
      </Button>
      <span className="text-muted-foreground text-sm tabular-nums">
        {page} de {pageCount}
      </span>
      <Button
        asChild
        variant="outline"
        size="sm"
        aria-disabled={page >= pageCount}
      >
        <Link
          href={href(page + 1)}
          className={
            page >= pageCount ? "pointer-events-none opacity-50" : undefined
          }
        >
          Próxima <ChevronRightIcon />
        </Link>
      </Button>
    </nav>
  );
}
