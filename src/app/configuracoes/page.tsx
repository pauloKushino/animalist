import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-lg" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const profile = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, displayUsername: true, username: true, bio: true },
  });
  // quem entrou com Google/Discord chega aqui sem username
  const firstTime = !profile.username;

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-xl">
          {firstTime ? "Bem-vindo ao animalist!" : "Seu perfil"}
        </CardTitle>
        <CardDescription>
          {firstTime
            ? "Escolha um nome de usuário para ter sua página e sua lista públicas."
            : "Essas informações aparecem no seu perfil público."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm
          defaults={{
            name: profile.name,
            username: profile.displayUsername ?? profile.username ?? "",
            bio: profile.bio ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}
