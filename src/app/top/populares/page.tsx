import type { Metadata } from "next";
import { AnimeRankList } from "@/components/anime/anime-rank-list";
import { TopTabs } from "@/components/anime/top-tabs";
import { getMostPopular } from "@/server/catalog";

export const metadata: Metadata = { title: "Animes mais populares" };

export default async function PopularPage() {
  const animes = await getMostPopular(100);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Top 100 animes</h1>
      <TopTabs active="/top/populares" />
      <p className="text-muted-foreground text-sm">
        Ordenado por quantas pessoas têm o anime na lista. Em caso de empate,
        vale a popularidade na AniList.
      </p>
      <AnimeRankList animes={animes} />
    </div>
  );
}
