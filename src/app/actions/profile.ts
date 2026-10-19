"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export type ProfileFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "username" | "bio", string>>;
  saved?: boolean;
  username?: string;
};

// mesmas regras do plugin username do Better Auth (src/lib/auth.ts)
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .max(50, "Máximo de 50 caracteres."),
  username: z
    .string()
    .trim()
    .min(3, "Pelo menos 3 caracteres.")
    .max(20, "Máximo de 20 caracteres.")
    .regex(/^[a-zA-Z0-9_.]+$/, "Use só letras, números, ponto e _."),
  bio: z.string().trim().max(500, "Máximo de 500 caracteres."),
});

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sua sessão expirou. Entre de novo." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    username: formData.get("username") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: ProfileFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<
        ProfileFormState["fieldErrors"]
      >;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { name, bio } = parsed.data;
  const displayUsername = parsed.data.username;
  const username = displayUsername.toLowerCase();

  const taken = await db.user.findFirst({
    where: { username, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken)
    return {
      fieldErrors: { username: "Esse nome de usuário já está em uso." },
    };

  await db.user.update({
    where: { id: user.id },
    data: { name, username, displayUsername, bio: bio || null },
  });

  if (user.username) updateTag(`user:${user.username}`);
  updateTag(`user:${username}`);
  return { saved: true, username };
}
