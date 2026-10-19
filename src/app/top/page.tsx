import type { Metadata } from "next";
import { AnimeRankList } from "@/components/anime/anime-rank-list";
import { TopTabs } from "@/components/anime/top-tabs";
import { MIN_VOTES } from "@/server/stats";
import { getTopRated } from "@/server/catalog";

export const metadata: Metadata = { title: "Top animes por nota" };

export default async function TopPage() {
  const animes = await getTopRated(100);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Top 100 animes</h1>
      <TopTabs active="/top" />
      <p className="text-muted-foreground text-sm">
        Nota ponderada: começa pela nota da AniList e passa a pesar a nota da
        comunidade conforme os votos chegam (a partir de {MIN_VOTES} votos ela
        já conta metade).
      </p>
      <AnimeRankList animes={animes} />
    </div>
  );
}
