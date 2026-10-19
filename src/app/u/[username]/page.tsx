import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnimeGrid } from "@/components/anime/anime-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDate,
  formatNumber,
  LIST_STATUSES,
  listStatusLabels,
  listStatusSlugs,
} from "@/lib/labels";
import { getCurrentUser } from "@/lib/session";
import { getListEntries, getProfile } from "@/server/list";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return {
    title: profile ? `${profile.name} (@${profile.username})` : "Perfil",
  };
}

export default function ProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProfileContent params={params} />
    </Suspense>
  );
}

async function ProfileContent({ params }: Pick<Props, "params">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const [entries, viewer] = await Promise.all([
    getListEntries(profile.id),
    getCurrentUser(),
  ]);

  const counts = Object.fromEntries(
    LIST_STATUSES.map((status) => [
      status,
      entries.filter((e) => e.status === status).length,
    ]),
  );
  const episodes = entries.reduce((sum, entry) => sum + entry.progress, 0);
  const scored = entries.filter((entry) => entry.score !== null);
  const meanScore = scored.length
    ? (
        scored.reduce((sum, entry) => sum + entry.score!, 0) / scored.length
      ).toFixed(2)
    : null;

  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader
        profile={profile}
        active="perfil"
        isOwner={viewer?.id === profile.id}
      />

      {profile.bio && (
        <p className="max-w-2xl whitespace-pre-line">{profile.bio}</p>
      )}

      <section className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Estatísticas</h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border p-3">
              <dt className="text-muted-foreground text-xs">Animes</dt>
              <dd className="text-xl font-bold">
                {formatNumber(entries.length)}
              </dd>
            </div>
            <div className="rounded-xl border p-3">
              <dt className="text-muted-foreground text-xs">Episódios</dt>
              <dd className="text-xl font-bold">{formatNumber(episodes)}</dd>
            </div>
            <div className="rounded-xl border p-3">
              <dt className="text-muted-foreground text-xs">Nota média</dt>
              <dd className="text-xl font-bold">
                {meanScore?.replace(".", ",") ?? "—"}
              </dd>
            </div>
          </dl>
          <ul className="flex flex-col gap-1 text-sm">
            {LIST_STATUSES.map((status) => (
              <li key={status}>
                <Link
                  href={`/u/${profile.username}/lista?status=${listStatusSlugs[status]}`}
                  className="hover:bg-muted flex justify-between rounded-md px-2 py-1"
                >
                  <span>{listStatusLabels[status]}</span>
                  <span className="tabular-nums">{counts[status]}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">
            Membro desde {formatDate(profile.createdAt)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Atualizados recentemente</h2>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              A lista ainda está vazia.
            </p>
          ) : (
            <AnimeGrid
              animes={entries.slice(0, 8).map((entry) => entry.anime)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
