import Link from "next/link";
import { StarIcon, UsersIcon } from "lucide-react";
import { AnimeCover } from "@/components/anime/anime-cover";
import { animeHref, animeMeta, animeTitle } from "@/lib/anime";
import { formatNumber, formatScore } from "@/lib/labels";
import { seasonLabel } from "@/lib/season";
import type { AnimeCardData } from "@/server/catalog";

export function AnimeRankList({ animes }: { animes: AnimeCardData[] }) {
  return (
    <ol className="divide-y rounded-xl border">
      {animes.map((anime, index) => {
        const title = animeTitle(anime);
        return (
          <li key={anime.id} className="flex items-center gap-3 p-3 sm:gap-4">
            <span className="text-muted-foreground w-8 shrink-0 text-center text-lg font-bold tabular-nums">
              {index + 1}
            </span>
            <Link href={animeHref(anime)} className="w-12 shrink-0">
              <AnimeCover
                src={anime.coverImage}
                color={anime.coverColor}
                alt={title}
                sizes="48px"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={animeHref(anime)}
                className="hover:text-primary line-clamp-2 font-medium"
              >
                {title}
              </Link>
              <p className="text-muted-foreground text-xs">
                {animeMeta(anime)}
                {anime.season && anime.seasonYear
                  ? ` · ${seasonLabel({ season: anime.season, year: anime.seasonYear })}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 text-sm">
              <span className="flex items-center gap-1 font-semibold">
                <StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
                {formatScore(anime.score)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <UsersIcon className="size-3" />
                {formatNumber(anime.members)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
