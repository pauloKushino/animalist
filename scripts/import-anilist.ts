// Importa animes da AniList para o banco.
//
//   npm run anime:import                    → 1.000 mais populares + temporada atual e a próxima
//   npm run anime:import -- --paginas 40    → 2.000 mais populares (50 por página)
//   npm run anime:import -- --temporada 2026-outubro
//   npm run anime:import -- --so-temporadas → pula os populares
//
// A AniList permite ~30 requisições/minuto, então 20 páginas levam cerca de 1 minuto.

import { parseArgs } from "node:util";
import { db } from "./db";
import { importPopular, importSeason } from "@/server/importer";
import { recalculateAllStats } from "@/server/stats";
import {
  seasonFromSlug,
  seasonLabel,
  seasonOfDate,
  shiftSeason,
  type SeasonRef,
} from "@/lib/season";

const { values } = parseArgs({
  options: {
    paginas: { type: "string", default: "20" },
    temporada: { type: "string", multiple: true },
    "so-temporadas": { type: "boolean", default: false },
  },
});

function parseSeason(text: string): SeasonRef {
  const [year, slug] = text.split("-");
  const season = seasonFromSlug(slug ?? "");
  if (!season || !Number(year)) {
    throw new Error(
      `Temporada inválida: "${text}". Use ANO-mes, ex.: 2026-outubro`,
    );
  }
  return { season, year: Number(year) };
}

async function main() {
  const log = (message: string) => console.log(`  ${message}`);
  const started = Date.now();

  if (!values["so-temporadas"]) {
    const pages = Number(values.paginas);
    console.log(`Importando ${pages * 50} animes mais populares…`);
    await importPopular(db, pages, log);
  }

  const current = seasonOfDate(new Date());
  const seasons = values.temporada?.map(parseSeason) ?? [
    current,
    shiftSeason(current, 1),
  ];
  for (const ref of seasons) {
    console.log(`Importando temporada ${seasonLabel(ref)}…`);
    await importSeason(db, ref, log);
  }

  console.log("Recalculando notas e ranking…");
  await recalculateAllStats(db);

  const total = await db.anime.count();
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(`Pronto: ${total} animes no banco (${seconds}s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
