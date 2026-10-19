// Consultas do catálogo de animes. Tudo que é igual para todo mundo fica em cache
// ("use cache") com as tags:
//   anime:<id>  → página de um anime
//   animes      → listas (temporada, top, explorar)
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type {
  AnimeFormat,
  AnimeStatus,
  Season,
} from "@/generated/prisma/enums";
import { seasonOfDate, type SeasonRef } from "@/lib/season";
import { importSearch } from "@/server/importer";

export const cardSelect = {
  id: true,
  slug: true,
  titleRomaji: true,
  titleEnglish: true,
  coverImage: true,
  coverColor: true,
  format: true,
  episodes: true,
  status: true,
  season: true,
  seasonYear: true,
  score: true,
  members: true,
  rank: true,
} satisfies Prisma.AnimeSelect;

export type AnimeCardData = Prisma.AnimeGetPayload<{
  select: typeof cardSelect;
}>;

const popularOrder: Prisma.AnimeOrderByWithRelationInput[] = [
  { members: "desc" },
  { anilistPopularity: "desc" },
];

export async function getAnime(id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`anime:${id}`);

  return db.anime.findUnique({
    where: { id },
    include: {
      genres: { orderBy: { name: "asc" } },
      studios: { orderBy: { name: "asc" } },
    },
  });
}

export async function getCurrentSeason(): Promise<SeasonRef> {
  "use cache";
  cacheLife("hours");
  return seasonOfDate(new Date());
}

export async function getSeasonAnimes(
  { season, year }: SeasonRef,
  limit?: number,
) {
  "use cache";
  cacheLife("hours");
  cacheTag("animes");

  return db.anime.findMany({
    where: { season, seasonYear: year },
    select: cardSelect,
    orderBy: popularOrder,
    take: limit,
  });
}

export async function getTopRated(limit = 100) {
  "use cache";
  cacheLife("hours");
  cacheTag("animes");

  return db.anime.findMany({
    where: { rank: { not: null } },
    select: cardSelect,
    orderBy: { rank: "asc" },
    take: limit,
  });
}

export async function getMostPopular(limit = 100) {
  "use cache";
  cacheLife("hours");
  cacheTag("animes");

  return db.anime.findMany({
    select: cardSelect,
    orderBy: popularOrder,
    take: limit,
  });
}

export async function getGenres() {
  "use cache";
  cacheLife("days");
  cacheTag("animes");

  return db.genre.findMany({ orderBy: { name: "asc" } });
}

export async function getSeasonYears() {
  "use cache";
  cacheLife("days");
  cacheTag("animes");

  const rows = await db.anime.findMany({
    where: { seasonYear: { not: null } },
    distinct: ["seasonYear"],
    select: { seasonYear: true },
    orderBy: { seasonYear: "desc" },
  });
  return rows.map((row) => row.seasonYear!);
}

// ---------------------------------------------------------------------------
// Explorar / busca
// ---------------------------------------------------------------------------

export const SORTS = ["popularidade", "nota", "recentes", "titulo"] as const;
export type CatalogSort = (typeof SORTS)[number];
export const PAGE_SIZE = 30;

export type CatalogFilters = {
  q?: string;
  genre?: string; // slug
  format?: AnimeFormat;
  status?: AnimeStatus;
  year?: number;
  season?: Season;
  sort: CatalogSort;
  page: number;
};

const sortOrder: Record<CatalogSort, Prisma.AnimeOrderByWithRelationInput[]> = {
  popularidade: popularOrder,
  nota: [
    { score: { sort: "desc", nulls: "last" } },
    { anilistPopularity: "desc" },
  ],
  recentes: [
    { startDate: { sort: "desc", nulls: "last" } },
    { anilistPopularity: "desc" },
  ],
  titulo: [{ titleRomaji: "asc" }],
};

// ids que batem com o texto em qualquer título ou sinônimo, ignorando acentos
async function matchTitle(q: string) {
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Anime"
    WHERE unaccent("titleRomaji") ILIKE unaccent(${pattern})
       OR unaccent(coalesce("titleEnglish", '')) ILIKE unaccent(${pattern})
       OR coalesce("titleNative", '') ILIKE ${pattern}
       OR unaccent(array_to_string(synonyms, ' ')) ILIKE unaccent(${pattern})
    LIMIT 500`;
  return rows.map((row) => row.id);
}

async function runSearch(filters: CatalogFilters) {
  const where: Prisma.AnimeWhereInput = {
    format: filters.format,
    status: filters.status,
    seasonYear: filters.year,
    season: filters.season,
    genres: filters.genre ? { some: { slug: filters.genre } } : undefined,
  };
  if (filters.q) where.id = { in: await matchTitle(filters.q) };

  const [items, total] = await Promise.all([
    db.anime.findMany({
      where,
      select: cardSelect,
      orderBy: sortOrder[filters.sort],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.anime.count({ where }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

async function browseCached(filters: CatalogFilters) {
  "use cache";
  cacheLife("hours");
  cacheTag("animes");
  return runSearch(filters);
}

// Busca na AniList no máximo uma vez por hora para o mesmo texto (por instância).
const remoteSearches = new Map<string, number>();
const REMOTE_SEARCH_TTL = 60 * 60 * 1000;

/**
 * Sem texto: lista filtrada, em cache.
 * Com texto: busca no banco; se achar pouco, busca na AniList, salva e busca de novo.
 * Precisa ser chamada dentro de <Suspense> (depende de searchParams).
 */
export async function searchCatalog(filters: CatalogFilters) {
  if (!filters.q) return browseCached(filters);

  const result = await runSearch(filters);
  const key = filters.q.toLowerCase();
  const lastTry = remoteSearches.get(key) ?? 0;

  if (
    result.total < 5 &&
    key.length >= 3 &&
    Date.now() - lastTry > REMOTE_SEARCH_TTL
  ) {
    remoteSearches.set(key, Date.now());
    try {
      const imported = await importSearch(db, filters.q);
      if (imported > 0) return runSearch(filters);
    } catch (error) {
      // AniList fora do ar não pode derrubar a busca local
      console.error("Busca na AniList falhou:", error);
    }
  }
  return result;
}
