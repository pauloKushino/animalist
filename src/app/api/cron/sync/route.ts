// Job diário (agendado em vercel.json): atualiza animes em exibição, importa a
// temporada atual e a próxima, e recalcula notas e ranking.
// Só roda com o cabeçalho `Authorization: Bearer $CRON_SECRET` (a Vercel envia sozinha).
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { seasonOfDate, shiftSeason } from "@/lib/season";
import { importSeason, refreshAnimes } from "@/server/importer";
import { recalculateAllStats } from "@/server/stats";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "não autorizado" }, { status: 401 });
  }

  const started = Date.now();
  const airing = await db.anime.findMany({
    where: { status: { in: ["RELEASING", "NOT_YET_RELEASED", "HIATUS"] } },
    select: { id: true, anilistId: true },
  });
  const refreshed = await refreshAnimes(
    db,
    airing.map((anime) => anime.anilistId),
  );

  const current = seasonOfDate(new Date());
  let imported = 0;
  for (const season of [current, shiftSeason(current, 1)]) {
    imported += await importSeason(db, season);
  }

  await recalculateAllStats(db);

  // páginas dos animes atualizados e listas (temporada, top, explorar)
  for (const anime of airing) revalidateTag(`anime:${anime.id}`, "max");
  revalidateTag("animes", "max");

  return Response.json({
    refreshed,
    imported,
    seconds: Math.round((Date.now() - started) / 1000),
  });
}
