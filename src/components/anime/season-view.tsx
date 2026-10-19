import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimeGrid } from "@/components/anime/anime-card";
import { Button } from "@/components/ui/button";
import {
  seasonHref,
  seasonLabel,
  shiftSeason,
  type SeasonRef,
} from "@/lib/season";
import { getSeasonAnimes, type AnimeCardData } from "@/server/catalog";

const groups: { title: string; formats: (string | null)[] }[] = [
  { title: "Séries de TV", formats: ["TV", "TV_SHORT"] },
  { title: "Filmes", formats: ["MOVIE"] },
  {
    title: "ONAs, OVAs e especiais",
    formats: ["ONA", "OVA", "SPECIAL", "MUSIC", null],
  },
];

export async function SeasonView({ season }: { season: SeasonRef }) {
  const animes = await getSeasonAnimes(season);
  const previous = shiftSeason(season, -1);
  const next = shiftSeason(season, 1);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Temporada de {seasonLabel(season)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {animes.length} animes que estrearam nesta temporada
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={seasonHref(previous)}>
              <ChevronLeftIcon /> {seasonLabel(previous)}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={seasonHref(next)}>
              {seasonLabel(next)} <ChevronRightIcon />
            </Link>
          </Button>
        </div>
      </header>

      {animes.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">
          Nenhum anime desta temporada no catálogo ainda.
        </p>
      )}

      {groups.map((group) => {
        const items = animes.filter((anime: AnimeCardData) =>
          group.formats.includes(anime.format),
        );
        if (items.length === 0) return null;
        return (
          <section key={group.title} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              {group.title}{" "}
              <span className="text-muted-foreground font-normal">
                ({items.length})
              </span>
            </h2>
            <AnimeGrid animes={items} />
          </section>
        );
      })}
    </div>
  );
}
