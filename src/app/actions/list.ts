"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { LIST_STATUSES, type ListStatusName } from "@/lib/labels";
import { recalculateAnimeStats } from "@/server/stats";

export type ListEntryState = {
  status: ListStatusName;
  score: number | null;
  progress: number;
};

export type ListActionResult =
  { ok: true; entry: ListEntryState | null } | { ok: false; error: string };

const saveSchema = z.object({
  animeId: z.number().int().positive(),
  status: z.enum(LIST_STATUSES).optional(),
  score: z.number().int().min(1).max(10).nullable().optional(),
  progress: z.number().int().min(0).max(10_000).optional(),
});

function today() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

async function afterChange(userId: string, animeId: number) {
  await recalculateAnimeStats(db, animeId);
  updateTag(`list:${userId}`);
  updateTag(`anime:${animeId}`);
}

/**
 * Adiciona ou atualiza um anime na lista do usuário logado.
 * Regras: progresso não passa do total; chegar ao último episódio marca "Completo";
 * marcar "Completo" preenche o progresso; começar a assistir sai de "Planejo assistir".
 */
export async function saveListEntry(
  input: z.input<typeof saveSchema>,
): Promise<ListActionResult> {
  const user = await getCurrentUser();
  if (!user)
    return { ok: false, error: "Entre na sua conta para usar a lista." };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const { animeId, ...changes } = parsed.data;

  const anime = await db.anime.findUnique({
    where: { id: animeId },
    select: { episodes: true },
  });
  if (!anime) return { ok: false, error: "Anime não encontrado." };

  const current = await db.listEntry.findUnique({
    where: { userId_animeId: { userId: user.id, animeId } },
  });

  let status: ListStatusName =
    changes.status ?? current?.status ?? "PLAN_TO_WATCH";
  let progress = changes.progress ?? current?.progress ?? 0;
  const score =
    changes.score !== undefined ? changes.score : (current?.score ?? null);
  const total = anime.episodes;

  if (total !== null) progress = Math.min(progress, total);
  if (changes.status === "COMPLETED" && total !== null) progress = total;
  if (
    changes.progress !== undefined &&
    total !== null &&
    progress === total &&
    progress > 0
  ) {
    status = "COMPLETED";
  } else if (
    changes.progress !== undefined &&
    progress > 0 &&
    status === "PLAN_TO_WATCH"
  ) {
    status = "WATCHING";
  }

  const startedAt =
    current?.startedAt ??
    (status === "WATCHING" || status === "COMPLETED" ? today() : null);
  const finishedAt =
    status === "COMPLETED" ? (current?.finishedAt ?? today()) : null;

  const data = { status, progress, score, startedAt, finishedAt };
  await db.listEntry.upsert({
    where: { userId_animeId: { userId: user.id, animeId } },
    create: { userId: user.id, animeId, ...data },
    update: data,
  });

  await afterChange(user.id, animeId);
  return { ok: true, entry: { status, score, progress } };
}

export async function removeListEntry(
  animeId: number,
): Promise<ListActionResult> {
  const user = await getCurrentUser();
  if (!user)
    return { ok: false, error: "Entre na sua conta para usar a lista." };
  if (!Number.isInteger(animeId))
    return { ok: false, error: "Dados inválidos." };

  await db.listEntry.deleteMany({ where: { userId: user.id, animeId } });
  await afterChange(user.id, animeId);
  return { ok: true, entry: null };
}
