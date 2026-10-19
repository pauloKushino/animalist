import Link from "next/link";
import { StarIcon } from "lucide-react";
import { AnimeCover } from "@/components/anime/anime-cover";
import { animeHref, animeMeta, animeTitle } from "@/lib/anime";
import { formatScore } from "@/lib/labels";
import type { AnimeCardData } from "@/server/catalog";

export function AnimeCard({ anime }: { anime: AnimeCardData }) {
  const title = animeTitle(anime);
  return (
    <Link href={animeHref(anime)} className="group flex flex-col gap-2">
      <div className="relative">
        <AnimeCover
          src={anime.coverImage}
          color={anime.coverColor}
          alt={title}
          sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw"
          className="transition-transform group-hover:scale-[1.02]"
        />
        {anime.score !== null && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
            <StarIcon className="size-3 fill-yellow-400 text-yellow-400" />
            {formatScore(anime.score)}
          </span>
        )}
      </div>
      <div>
        <p className="group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium">
          {title}
        </p>
        <p className="text-muted-foreground text-xs">{animeMeta(anime)}</p>
      </div>
    </Link>
  );
}

export function AnimeGrid({ animes }: { animes: AnimeCardData[] }) {
  if (animes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        Nenhum anime encontrado.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
}
