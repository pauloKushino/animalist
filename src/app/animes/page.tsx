import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnimeGrid } from "@/components/anime/anime-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnimeFormat, AnimeStatus } from "@/generated/prisma/enums";
import {
  formatLabels,
  formatNumber,
  genreLabel,
  statusLabels,
} from "@/lib/labels";
import { SEASONS, seasonFromSlug, seasonSlug } from "@/lib/season";
import {
  getGenres,
  getSeasonYears,
  searchCatalog,
  SORTS,
  type CatalogFilters,
  type CatalogSort,
} from "@/server/catalog";

export const metadata: Metadata = { title: "Explorar animes" };

type SearchParams = Awaited<PageProps<"/animes">["searchParams"]>;

const sortLabels: Record<CatalogSort, string> = {
  popularidade: "Mais populares",
  nota: "Melhor nota",
  recentes: "Mais recentes",
  titulo: "Título (A–Z)",
};

const seasonMonth: Record<string, string> = {
  janeiro: "Janeiro",
  abril: "Abril",
  julho: "Julho",
  outubro: "Outubro",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(params: SearchParams): CatalogFilters {
  const q = first(params.q)?.trim().slice(0, 100) || undefined;
  const format = first(params.formato);
  const status = first(params.status);
  const year = Number(first(params.ano));
  const sort = first(params.ordem);
  const page = Number(first(params.pagina));

  return {
    q,
    genre: first(params.genero) || undefined,
    format:
      format && format in formatLabels ? (format as AnimeFormat) : undefined,
    status:
      status && status in statusLabels ? (status as AnimeStatus) : undefined,
    year: Number.isInteger(year) && year > 1900 ? year : undefined,
    season: seasonFromSlug(first(params.temporada) ?? "") ?? undefined,
    sort: SORTS.includes(sort as CatalogSort)
      ? (sort as CatalogSort)
      : "popularidade",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export default function AnimesPage({ searchParams }: PageProps<"/animes">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Explorar animes</h1>
      <Suspense fallback={<ExplorerSkeleton />}>
        <Explorer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Explorer({
  searchParams,
}: Pick<PageProps<"/animes">, "searchParams">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const [genres, years, result] = await Promise.all([
    getGenres(),
    getSeasonYears(),
    searchCatalog(filters),
  ]);

  const selectClass =
    "border-input bg-background h-8 rounded-lg border px-2 text-sm dark:bg-input/30";

  return (
    <>
      <form
        action="/animes"
        className="flex flex-col gap-3 rounded-xl border p-3"
      >
        <Input
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Nome do anime (em qualquer idioma)"
          aria-label="Nome do anime"
        />
        <div className="flex flex-wrap gap-2">
          <select
            name="genero"
            defaultValue={filters.genre ?? ""}
            className={selectClass}
            aria-label="Gênero"
          >
            <option value="">Todos os gêneros</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.slug}>
                {genreLabel(genre.name)}
              </option>
            ))}
          </select>
          <select
            name="formato"
            defaultValue={filters.format ?? ""}
            className={selectClass}
            aria-label="Formato"
          >
            <option value="">Todos os formatos</option>
            {Object.entries(formatLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className={selectClass}
            aria-label="Status"
          >
            <option value="">Qualquer status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="ano"
            defaultValue={filters.year ?? ""}
            className={selectClass}
            aria-label="Ano"
          >
            <option value="">Qualquer ano</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            name="temporada"
            defaultValue={filters.season ? seasonSlug(filters.season) : ""}
            className={selectClass}
            aria-label="Temporada"
          >
            <option value="">Qualquer temporada</option>
            {SEASONS.map((season) => (
              <option key={season} value={seasonSlug(season)}>
                {seasonMonth[seasonSlug(season)]}
              </option>
            ))}
          </select>
          <select
            name="ordem"
            defaultValue={filters.sort}
            className={selectClass}
            aria-label="Ordenar por"
          >
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
          <Button type="submit">Filtrar</Button>
          <Button asChild variant="ghost">
            <Link href="/animes">Limpar</Link>
          </Button>
        </div>
      </form>

      <p className="text-muted-foreground text-sm">
        {formatNumber(result.total)} {result.total === 1 ? "anime" : "animes"}
        {filters.q ? ` para "${filters.q}"` : ""}
      </p>

      <AnimeGrid animes={result.items} />

      <Pagination
        page={filters.page}
        pageCount={result.pageCount}
        basePath="/animes"
        params={{
          q: filters.q,
          genero: filters.genre,
          formato: filters.format,
          status: filters.status,
          ano: filters.year?.toString(),
          temporada: filters.season ? seasonSlug(filters.season) : undefined,
          ordem: filters.sort === "popularidade" ? undefined : filters.sort,
        }}
      />
    </>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-full" />
        ))}
      </div>
    </div>
  );
}
