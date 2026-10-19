// Temporadas de anime seguem o calendário japonês. No Brasil as estações são invertidas,
// então na interface usamos o mês de início ("Temporada de Outubro 2026").

export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
export type SeasonName = (typeof SEASONS)[number];

export type SeasonRef = { season: SeasonName; year: number };

const slugs: Record<SeasonName, string> = {
  WINTER: "janeiro",
  SPRING: "abril",
  SUMMER: "julho",
  FALL: "outubro",
};

const labels: Record<SeasonName, string> = {
  WINTER: "Janeiro",
  SPRING: "Abril",
  SUMMER: "Julho",
  FALL: "Outubro",
};

export function seasonSlug(season: SeasonName) {
  return slugs[season];
}

export function seasonLabel({ season, year }: SeasonRef) {
  return `${labels[season]} ${year}`;
}

export function seasonFromSlug(slug: string): SeasonName | null {
  const entry = Object.entries(slugs).find(([, value]) => value === slug);
  return entry ? (entry[0] as SeasonName) : null;
}

export function seasonHref({ season, year }: SeasonRef) {
  return `/temporada/${year}/${slugs[season]}`;
}

export function seasonOfDate(date: Date): SeasonRef {
  return {
    season: SEASONS[Math.floor(date.getUTCMonth() / 3)],
    year: date.getUTCFullYear(),
  };
}

export function shiftSeason(
  { season, year }: SeasonRef,
  delta: number,
): SeasonRef {
  const index = year * 4 + SEASONS.indexOf(season) + delta;
  return {
    season: SEASONS[((index % 4) + 4) % 4],
    year: Math.floor(index / 4),
  };
}
