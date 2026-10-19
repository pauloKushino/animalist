// Consultas de perfis e listas. Listas são públicas (como no MAL), menos as anotações.
// Tags de cache:
//   user:<username> → dados do perfil
//   list:<userId>   → lista de um usuário (as actions em src/app/actions/list.ts invalidam)
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { ListStatus } from "@/generated/prisma/enums";
import { cardSelect } from "@/server/catalog";

export async function getProfile(username: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`user:${username.toLowerCase()}`);

  return db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });
}

export async function getListEntries(userId: string, status?: ListStatus) {
  "use cache";
  cacheLife("hours");
  cacheTag(`list:${userId}`);

  return db.listEntry.findMany({
    where: { userId, status },
    select: {
      id: true,
      status: true,
      score: true,
      progress: true,
      updatedAt: true,
      anime: { select: cardSelect },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getListCounts(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`list:${userId}`);

  const groups = await db.listEntry.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const counts: Partial<Record<ListStatus, number>> = {};
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export async function getListEntry(userId: string, animeId: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`list:${userId}`);

  return db.listEntry.findUnique({
    where: { userId_animeId: { userId, animeId } },
    select: { status: true, score: true, progress: true },
  });
}
