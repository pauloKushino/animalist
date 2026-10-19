// Converte animes da AniList para o nosso banco (upsert por anilistId).
// Recebe o client do Prisma por parâmetro para funcionar no app e nos scripts.

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  AnimeFormat,
  AnimeStatus,
  Season,
} from "@/generated/prisma/enums";
import {
  fetchMediaPage,
  type AniListDate,
  type AniListMedia,
} from "@/server/anilist";
import type { SeasonRef } from "@/lib/season";

type Log = (message: string) => void;

const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
const STATUSES = [
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];
const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];

export function slugify(text: string) {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return slug || "anime";
}

// A AniList devolve a sinopse com <br>, <i> e entidades HTML; guardamos texto puro.
export function cleanDescription(text: string | null) {
  if (!text) return null;
  const clean = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clean || null;
}

function toDate(date: AniListDate) {
  if (!date.year) return null;
  return new Date(Date.UTC(date.year, (date.month ?? 1) - 1, date.day ?? 1));
}

function pick<T extends string>(value: string | null, allowed: string[]) {
  return value && allowed.includes(value) ? (value as T) : null;
}

function toAnimeData(media: AniListMedia) {
  return {
    malId: media.idMal,
    slug: slugify(media.title.english ?? media.title.romaji),
    titleRomaji: media.title.romaji,
    titleEnglish: media.title.english,
    titleNative: media.title.native,
    synonyms: media.synonyms ?? [],
    synopsis: cleanDescription(media.description),
    format: pick<AnimeFormat>(media.format, FORMATS),
    status: pick<AnimeStatus>(media.status, STATUSES),
    episodes: media.episodes,
    duration: media.duration,
    season: pick<Season>(media.season, SEASONS),
    seasonYear: media.seasonYear,
    startDate: toDate(media.startDate),
    endDate: toDate(media.endDate),
    source: media.source,
    coverImage: media.coverImage.extraLarge ?? media.coverImage.large,
    coverColor: media.coverImage.color,
    bannerImage: media.bannerImage,
    nextEpisode: media.nextAiringEpisode?.episode ?? null,
    nextEpisodeAt: media.nextAiringEpisode
      ? new Date(media.nextAiringEpisode.airingAt * 1000)
      : null,
    anilistScore: media.averageScore,
    anilistPopularity: media.popularity ?? 0,
    syncedAt: new Date(),
  };
}

/** Salva (cria ou atualiza) uma lista de animes da AniList. Devolve quantos foram salvos. */
export async function upsertMedia(db: PrismaClient, mediaList: AniListMedia[]) {
  const media = mediaList.filter((m) => !m.isAdult);
  if (media.length === 0) return 0;

  // garante gêneros e estúdios antes, para depois só conectar por id
  const genreNames = [...new Set(media.flatMap((m) => m.genres))];
  const genres = await Promise.all(
    genreNames.map((name) =>
      db.genre.upsert({
        where: { name },
        create: { name, slug: slugify(name) },
        update: {},
      }),
    ),
  );
  const genreId = new Map(genres.map((g) => [g.name, g.id]));

  const studioNodes = new Map(
    media.flatMap((m) => m.studios.nodes).map((s) => [s.id, s.name]),
  );
  const studios = await Promise.all(
    [...studioNodes].map(([anilistId, name]) =>
      db.studio.upsert({
        where: { anilistId },
        create: { anilistId, name },
        update: { name },
      }),
    ),
  );
  const studioId = new Map(studios.map((s) => [s.anilistId, s.id]));

  for (const m of media) {
    const data = toAnimeData(m);
    const genreRefs = m.genres.map((name) => ({ id: genreId.get(name)! }));
    const studioRefs = m.studios.nodes.map((s) => ({
      id: studioId.get(s.id)!,
    }));

    await db.anime.upsert({
      where: { anilistId: m.id },
      create: {
        anilistId: m.id,
        ...data,
        // sem votos ainda, a nota ponderada é igual à da AniList (ver src/server/stats.ts)
        score: m.averageScore === null ? null : m.averageScore / 10,
        genres: { connect: genreRefs },
        studios: { connect: studioRefs },
      },
      update: {
        ...data,
        genres: { set: genreRefs },
        studios: { set: studioRefs },
      },
    });
  }
  return media.length;
}

/** Importa os animes mais populares da AniList (50 por página). */
export async function importPopular(
  db: PrismaClient,
  pages: number,
  log: Log = () => {},
) {
  let total = 0;
  for (let page = 1; page <= pages; page++) {
    const result = await fetchMediaPage({ page, sort: ["POPULARITY_DESC"] });
    total += await upsertMedia(db, result.media);
    log(`populares: página ${page}/${pages} (${total} animes)`);
    if (!result.hasNextPage) break;
  }
  return total;
}

/** Importa todos os animes de uma temporada. */
export async function importSeason(
  db: PrismaClient,
  ref: SeasonRef,
  log: Log = () => {},
) {
  let total = 0;
  // uma temporada raramente passa de 150 títulos; o limite evita loop infinito
  for (let page = 1; page <= 6; page++) {
    const result = await fetchMediaPage({
      page,
      season: ref.season,
      seasonYear: ref.year,
      sort: ["POPULARITY_DESC"],
    });
    total += await upsertMedia(db, result.media);
    log(
      `temporada ${ref.season} ${ref.year}: página ${page} (${total} animes)`,
    );
    if (!result.hasNextPage) break;
  }
  return total;
}

/** Atualiza animes que já estão no banco (ex.: em exibição), 50 por requisição. */
export async function refreshAnimes(
  db: PrismaClient,
  anilistIds: number[],
  log: Log = () => {},
) {
  let total = 0;
  for (let i = 0; i < anilistIds.length; i += 50) {
    const idIn = anilistIds.slice(i, i + 50);
    const result = await fetchMediaPage({ idIn, perPage: 50 });
    total += await upsertMedia(db, result.media);
    log(
      `atualizando: ${Math.min(i + 50, anilistIds.length)}/${anilistIds.length}`,
    );
  }
  return total;
}

/** Busca na AniList e salva o que encontrar (usado quando a busca local acha pouco). */
export async function importSearch(db: PrismaClient, search: string) {
  const result = await fetchMediaPage({
    search,
    perPage: 10,
    sort: ["SEARCH_MATCH", "POPULARITY_DESC"],
  });
  return upsertMedia(db, result.media);
}
