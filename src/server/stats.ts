// Nota ponderada, membros e ranking dos animes.
//
// nota = (v * R + m * C) / (v + m)
//   v = votos no animalist, R = média desses votos, m = MIN_VOTES
//   C = nota da AniList do próprio anime (0–100 → 0–10); sem ela, a média geral do site
//
// Com poucos votos a nota fica perto da AniList; com muitos, vira a nota da comunidade.

import { Prisma, type PrismaClient } from "@/generated/prisma/client";

export const MIN_VOTES = 25;
const DEFAULT_SITE_MEAN = 7;

async function siteMean(db: PrismaClient) {
  const result = await db.listEntry.aggregate({
    _avg: { score: true },
    where: { score: { not: null } },
  });
  return result._avg.score ?? DEFAULT_SITE_MEAN;
}

async function updateScores(db: PrismaClient, animeId?: number) {
  const mean = await siteMean(db);
  const filter =
    animeId === undefined ? Prisma.empty : Prisma.sql`AND a.id = ${animeId}`;

  await db.$executeRaw`
    WITH s AS (
      SELECT a.id,
             COUNT(le.id)::int    AS members,
             COUNT(le.score)::int AS voters,
             AVG(le.score)::float AS avg
      FROM "Anime" a
      LEFT JOIN "ListEntry" le ON le."animeId" = a.id
      WHERE TRUE ${filter}
      GROUP BY a.id
    )
    UPDATE "Anime" a
    SET members = s.members,
        "scoredBy" = s.voters,
        score = CASE
          WHEN a."anilistScore" IS NOT NULL THEN
            (s.voters * COALESCE(s.avg, 0) + ${MIN_VOTES}::float * a."anilistScore" / 10.0)
              / (s.voters + ${MIN_VOTES}::float)
          WHEN s.voters > 0 THEN
            (s.voters * s.avg + ${MIN_VOTES}::float * ${mean}::float) / (s.voters + ${MIN_VOTES}::float)
          ELSE NULL
        END
    FROM s
    WHERE s.id = a.id`;
}

/** Recalcula um anime só (chamado depois que alguém mexe na lista). Não mexe no ranking. */
export async function recalculateAnimeStats(db: PrismaClient, animeId: number) {
  await updateScores(db, animeId);
}

/** Recalcula tudo e refaz o ranking (job diário e script). */
export async function recalculateAllStats(db: PrismaClient) {
  await updateScores(db);

  // anime que ainda não estreou não entra no ranking
  await db.$executeRaw`
    UPDATE "Anime" a
    SET rank = r.position
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, "anilistPopularity" DESC)::int AS position
      FROM "Anime"
      WHERE score IS NOT NULL AND status IS DISTINCT FROM 'NOT_YET_RELEASED'
    ) r
    WHERE r.id = a.id`;

  await db.$executeRaw`
    UPDATE "Anime"
    SET rank = NULL
    WHERE (score IS NULL OR status = 'NOT_YET_RELEASED') AND rank IS NOT NULL`;
}
