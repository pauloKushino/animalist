import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enabledSocialProviders } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Entrar no animalist</CardTitle>
      </CardHeader>
      <CardContent>
        <AuthForm mode="entrar" providers={enabledSocialProviders} />
      </CardContent>
    </Card>
  );
}
