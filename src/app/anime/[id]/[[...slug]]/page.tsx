import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ExternalLinkIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { AnimeCover } from "@/components/anime/anime-cover";
import { ListEditor } from "@/components/list/list-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { animeHref, animeTitle } from "@/lib/anime";
import {
  formatDate,
  formatDateTime,
  formatLabels,
  formatNumber,
  formatScore,
  genreLabel,
  sourceLabels,
  statusLabels,
} from "@/lib/labels";
import { seasonHref, seasonLabel } from "@/lib/season";
import { getCurrentUser } from "@/lib/session";
import { getAnime } from "@/server/catalog";
import { getListEntry } from "@/server/list";

type Props = PageProps<"/anime/[id]/[[...slug]]">;

async function loadAnime(params: Props["params"]) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isInteger(animeId) || animeId <= 0) return null;
  return getAnime(animeId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const anime = await loadAnime(params);
  if (!anime) return { title: "Anime não encontrado" };

  return {
    title: animeTitle(anime),
    description: anime.synopsis?.slice(0, 160),
    alternates: { canonical: animeHref(anime) },
    openGraph: { images: anime.coverImage ? [anime.coverImage] : [] },
  };
}

export default function AnimePage({ params }: Props) {
  return (
    <Suspense fallback={<AnimeSkeleton />}>
      <AnimeDetails params={params} />
    </Suspense>
  );
}

async function AnimeDetails({ params }: Pick<Props, "params">) {
  const anime = await loadAnime(params);
  if (!anime) notFound();

  const title = animeTitle(anime);
  const season =
    anime.season && anime.seasonYear
      ? { season: anime.season, year: anime.seasonYear }
      : null;

  const info: [string, React.ReactNode][] = [
    ["Formato", anime.format ? formatLabels[anime.format] : null],
    ["Episódios", anime.episodes],
    ["Duração", anime.duration ? `${anime.duration} min por ep.` : null],
    ["Status", anime.status ? statusLabels[anime.status] : null],
    [
      "Temporada",
      season ? (
        <Link
          href={seasonHref(season)}
          className="hover:text-primary underline-offset-4 hover:underline"
        >
          {seasonLabel(season)}
        </Link>
      ) : null,
    ],
    [
      "Exibição",
      anime.startDate
        ? `${formatDate(anime.startDate)}${anime.endDate ? ` até ${formatDate(anime.endDate)}` : ""}`
        : null,
    ],
    ["Estúdio", anime.studios.map((s) => s.name).join(", ") || null],
    [
      "Origem",
      anime.source ? (sourceLabels[anime.source] ?? anime.source) : null,
    ],
  ];

  return (
    <article className="flex flex-col gap-6">
      {anime.bannerImage && (
        <div
          className="-mt-4 h-40 rounded-xl bg-cover bg-center sm:h-56"
          style={{ backgroundImage: `url(${anime.bannerImage})` }}
          role="presentation"
        />
      )}

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-4">
          <AnimeCover
            src={anime.coverImage}
            color={anime.coverColor}
            alt={title}
            sizes="220px"
            priority
            className="mx-auto w-44 md:w-full"
          />

          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <ListSection animeId={anime.id} episodes={anime.episodes} />
          </Suspense>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            {info
              .filter(([, value]) => value !== null && value !== undefined)
              .map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>

          <div className="flex flex-col gap-1 text-sm">
            <a
              href={`https://anilist.co/anime/${anime.anilistId}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Ver na AniList <ExternalLinkIcon className="size-3" />
            </a>
            {anime.malId && (
              <a
                href={`https://myanimelist.net/anime/${anime.malId}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Ver no MyAnimeList <ExternalLinkIcon className="size-3" />
              </a>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <header>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {title !== anime.titleRomaji && (
              <p className="text-muted-foreground">{anime.titleRomaji}</p>
            )}
            {anime.titleNative && (
              <p className="text-muted-foreground text-sm">
                {anime.titleNative}
              </p>
            )}
          </header>

          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            <Stat
              icon={
                <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
              }
              label="Nota"
              value={formatScore(anime.score)}
              hint={
                anime.scoredBy > 0
                  ? `${formatNumber(anime.scoredBy)} ${anime.scoredBy === 1 ? "voto" : "votos"}`
                  : "base AniList"
              }
            />
            <Stat
              icon={<TrophyIcon className="size-4" />}
              label="Ranking"
              value={anime.rank ? `#${formatNumber(anime.rank)}` : "—"}
            />
            <Stat
              icon={<UsersIcon className="size-4" />}
              label="Membros"
              value={formatNumber(anime.members)}
            />
          </div>

          {anime.status === "RELEASING" &&
            anime.nextEpisode &&
            anime.nextEpisodeAt && (
              <p className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm">
                Episódio {anime.nextEpisode} sai{" "}
                {formatDateTime(anime.nextEpisodeAt)} (horário de Brasília)
              </p>
            )}

          {anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.map((genre) => (
                <Badge key={genre.id} variant="secondary" asChild>
                  <Link href={`/animes?genero=${genre.slug}`}>
                    {genreLabel(genre.name)}
                  </Link>
                </Badge>
              ))}
            </div>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Sinopse</h2>
            {anime.synopsis ? (
              <p className="leading-relaxed whitespace-pre-line">
                {anime.synopsis}
              </p>
            ) : (
              <p className="text-muted-foreground">Sem sinopse ainda.</p>
            )}
            <p className="text-muted-foreground text-xs">
              Sinopse em inglês, via AniList.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        {icon} {label}
      </p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

// Lê a sessão: fica no seu próprio Suspense para o resto da página não esperar.
async function ListSection({
  animeId,
  episodes,
}: {
  animeId: number;
  episodes: number | null;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Button asChild className="w-full">
        <Link href="/entrar">Entre para adicionar à lista</Link>
      </Button>
    );
  }
  const entry = await getListEntry(user.id, animeId);
  return <ListEditor animeId={animeId} episodes={episodes} initial={entry} />;
}

function AnimeSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <Skeleton className="mx-auto aspect-[2/3] w-44 md:w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
