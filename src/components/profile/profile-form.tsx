"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; username: string; bio: string };
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaults.name}
          required
          maxLength={50}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Nome de usuário</Label>
        <Input
          id="username"
          name="username"
          defaultValue={defaults.username}
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_.]+"
          autoComplete="username"
        />
        <p className="text-muted-foreground text-xs">
          Seu perfil fica em animalist/u/seu_nome. Letras, números, ponto e _.
        </p>
        {errors.username && (
          <p className="text-destructive text-sm">{errors.username}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={defaults.bio}
          maxLength={500}
          rows={4}
        />
        {errors.bio && <p className="text-destructive text-sm">{errors.bio}</p>}
      </div>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Perfil salvo.{" "}
          <Link
            href={`/u/${state.username}`}
            className="underline underline-offset-4"
          >
            Ver meu perfil
          </Link>
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
