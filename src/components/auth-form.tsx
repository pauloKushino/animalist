"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "discord";

const providerLabels: Record<Provider, string> = {
  google: "Google",
  discord: "Discord",
};

// Mensagens do Better Auth vêm em inglês; traduzimos as mais comuns.
const errorMessages: Record<string, string> = {
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail.",
  USERNAME_IS_ALREADY_TAKEN: "Esse nome de usuário já está em uso.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_USERNAME_OR_PASSWORD: "Usuário ou senha incorretos.",
  INVALID_USERNAME: "Use só letras, números, ponto e _ no nome de usuário.",
  USERNAME_TOO_SHORT: "O nome de usuário precisa ter pelo menos 3 caracteres.",
  USERNAME_TOO_LONG: "O nome de usuário pode ter no máximo 20 caracteres.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  INVALID_EMAIL: "E-mail inválido.",
};

function errorText(error: { code?: string; message?: string }) {
  return (
    (error.code && errorMessages[error.code]) ||
    error.message ||
    "Algo deu errado. Tente de novo."
  );
}

export function AuthForm({
  mode,
  providers,
}: {
  mode: "entrar" | "cadastro";
  providers: Provider[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "cadastro";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    setPending(true);

    let result;
    if (isSignUp) {
      result = await authClient.signUp.email({
        name: String(form.get("name")),
        username: String(form.get("username")),
        email: String(form.get("email")),
        password,
      });
    } else {
      // aceita e-mail ou nome de usuário no mesmo campo
      const login = String(form.get("login")).trim();
      result = login.includes("@")
        ? await authClient.signIn.email({ email: login, password })
        : await authClient.signIn.username({ username: login, password });
    }

    setPending(false);
    if (result.error) {
      toast.error(errorText(result.error));
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function signInWith(provider: Provider) {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
    if (error) {
      setPending(false);
      toast.error(errorText(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {providers.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {providers.map((provider) => (
              <Button
                key={provider}
                variant="outline"
                size="lg"
                disabled={pending}
                onClick={() => signInWith(provider)}
              >
                Continuar com {providerLabels[provider]}
              </Button>
            ))}
          </div>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <Separator className="flex-1" /> ou <Separator className="flex-1" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {isSignUp ? (
          <>
            <Field
              label="Nome"
              name="name"
              autoComplete="name"
              required
              maxLength={50}
            />
            <Field
              label="Nome de usuário"
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_.]+"
              hint="Aparece no seu perfil: animalist/u/seu_nome"
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </>
        ) : (
          <Field
            label="E-mail ou usuário"
            name="login"
            autoComplete="username"
            required
          />
        )}
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={8}
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Aguarde…" : isSignUp ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {isSignUp ? "Já tem conta? " : "Ainda não tem conta? "}
        <Link
          href={isSignUp ? "/entrar" : "/cadastro"}
          className="text-foreground underline underline-offset-4"
        >
          {isSignUp ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  hint,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  name: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
