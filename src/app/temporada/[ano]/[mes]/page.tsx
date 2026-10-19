import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SeasonView } from "@/components/anime/season-view";
import { Skeleton } from "@/components/ui/skeleton";
import { seasonFromSlug, seasonLabel, type SeasonRef } from "@/lib/season";

type Props = PageProps<"/temporada/[ano]/[mes]">;

async function parseSeason(params: Props["params"]): Promise<SeasonRef | null> {
  const { ano, mes } = await params;
  const year = Number(ano);
  const season = seasonFromSlug(mes);
  if (!season || !Number.isInteger(year) || year < 1940 || year > 2100)
    return null;
  return { season, year };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const season = await parseSeason(params);
  return {
    title: season ? `Temporada de ${seasonLabel(season)}` : "Temporada",
  };
}

export default function SeasonPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SeasonContent params={params} />
    </Suspense>
  );
}

async function SeasonContent({ params }: Pick<Props, "params">) {
  const season = await parseSeason(params);
  if (!season) notFound();
  return <SeasonView season={season} />;
}
