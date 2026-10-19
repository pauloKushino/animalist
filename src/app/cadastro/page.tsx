import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enabledSocialProviders } from "@/lib/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Criar sua conta</CardTitle>
      </CardHeader>
      <CardContent>
        <AuthForm mode="cadastro" providers={enabledSocialProviders} />
      </CardContent>
    </Card>
  );
}
