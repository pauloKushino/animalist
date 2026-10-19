import type { Metadata } from "next";
import { SeasonView } from "@/components/anime/season-view";
import { getCurrentSeason } from "@/server/catalog";

export const metadata: Metadata = { title: "Temporada atual" };

export default async function CurrentSeasonPage() {
  const season = await getCurrentSeason();
  return <SeasonView season={season} />;
}
