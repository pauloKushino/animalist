import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Profile = {
  name: string;
  username: string | null;
  displayUsername: string | null;
  image: string | null;
};

export function ProfileHeader({
  profile,
  active,
  isOwner,
}: {
  profile: Profile;
  active: "perfil" | "lista";
  isOwner: boolean;
}) {
  const base = `/u/${profile.username}`;
  const tabs = [
    { key: "perfil", href: base, label: "Perfil" },
    { key: "lista", href: `${base}/lista`, label: "Lista de animes" },
  ];

  return (
    <header className="flex flex-col gap-4 border-b pb-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {profile.image && <AvatarImage src={profile.image} alt="" />}
          <AvatarFallback className="text-lg">
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {profile.name}
          </h1>
          <p className="text-muted-foreground">
            @{profile.displayUsername ?? profile.username}
          </p>
        </div>
        {isOwner && (
          <Link
            href="/configuracoes"
            className="text-primary text-sm hover:underline"
          >
            Editar perfil
          </Link>
        )}
      </div>
      <nav className="flex gap-1 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5",
              tab.key === active
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
