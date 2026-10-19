import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnimeCover } from "@/components/anime/anime-cover";
import { ProgressButton } from "@/components/list/progress-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Skeleton } from "@/components/ui/skeleton";
import { animeHref, animeTitle } from "@/lib/anime";
import {
  formatLabels,
  LIST_STATUSES,
  listStatusFromSlug,
  listStatusLabels,
  listStatusSlugs,
  type ListStatusName,
} from "@/lib/labels";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { getListCounts, getListEntries, getProfile } from "@/server/list";

type Props = PageProps<"/u/[username]/lista">;

const statusColors: Record<ListStatusName, string> = {
  WATCHING: "border-l-green-500",
  COMPLETED: "border-l-blue-500",
  ON_HOLD: "border-l-yellow-500",
  DROPPED: "border-l-red-500",
  PLAN_TO_WATCH: "border-l-zinc-400",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return { title: profile ? `Lista de ${profile.name}` : "Lista" };
}

export default function ListPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ListContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ListContent({ params, searchParams }: Props) {
  const { username } = await params;
  const { status: statusParam } = await searchParams;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const status = listStatusFromSlug(
    Array.isArray(statusParam) ? statusParam[0] : statusParam,
  );
  const [entries, counts, viewer] = await Promise.all([
    getListEntries(profile.id, status),
    getListCounts(profile.id),
    getCurrentUser(),
  ]);
  const isOwner = viewer?.id === profile.id;
  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const base = `/u/${profile.username}/lista`;

  const tabs = [
    { href: base, label: "Todos", count: total, active: !status },
    ...LIST_STATUSES.map((s) => ({
      href: `${base}?status=${listStatusSlugs[s]}`,
      label: listStatusLabels[s],
      count: counts[s] ?? 0,
      active: status === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader profile={profile} active="lista" isOwner={isOwner} />

      <nav className="flex gap-1 overflow-x-auto text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5",
              tab.active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {tab.label} <span className="opacity-70">{tab.count}</span>
          </Link>
        ))}
      </nav>

      {entries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {isOwner ? (
            <>
              Nada aqui ainda.{" "}
              <Link href="/animes" className="text-primary hover:underline">
                Encontre animes
              </Link>{" "}
              para adicionar.
            </>
          ) : (
            "Nada aqui ainda."
          )}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {entries.map((entry) => {
            const title = animeTitle(entry.anime);
            const total = entry.anime.episodes;
            return (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 border-l-4 p-3",
                  statusColors[entry.status],
                )}
              >
                <Link href={animeHref(entry.anime)} className="w-10 shrink-0">
                  <AnimeCover
                    src={entry.anime.coverImage}
                    color={entry.anime.coverColor}
                    alt={title}
                    sizes="40px"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={animeHref(entry.anime)}
                    className="hover:text-primary line-clamp-1 font-medium"
                  >
                    {title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {entry.anime.format
                      ? formatLabels[entry.anime.format]
                      : "—"}
                    {!status && ` · ${listStatusLabels[entry.status]}`}
                  </p>
                </div>
                <div className="flex w-20 shrink-0 items-center justify-end gap-1.5 text-sm tabular-nums">
                  <span>
                    {entry.progress}/{total ?? "?"}
                  </span>
                  {isOwner &&
                    entry.status === "WATCHING" &&
                    (total === null || entry.progress < total) && (
                      <ProgressButton
                        animeId={entry.anime.id}
                        progress={entry.progress}
                      />
                    )}
                </div>
                <div className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {entry.score ?? "—"}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
