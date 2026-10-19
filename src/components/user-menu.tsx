import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenuDropdown } from "@/components/user-menu-dropdown";
import { getCurrentUser } from "@/lib/session";

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost">
          <Link href="/entrar">Entrar</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/cadastro">Criar conta</Link>
        </Button>
      </div>
    );
  }

  return <UserMenuDropdown user={user} />;
}
