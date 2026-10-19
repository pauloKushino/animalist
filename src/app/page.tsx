import Link from "next/link";
import {
  CalendarIcon,
  ListChecksIcon,
  MessagesSquareIcon,
  StarIcon,
} from "lucide-react";
import { AnimeGrid } from "@/components/anime/anime-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { seasonLabel } from "@/lib/season";
import {
  getCurrentSeason,
  getSeasonAnimes,
  getTopRated,
  type AnimeCardData,
} from "@/server/catalog";

const features = [
  {
    icon: ListChecksIcon,
    title: "Sua lista",
    description:
      "Assistindo, completos, planejados. Progresso por episódio com um clique.",
  },
  {
    icon: StarIcon,
    title: "Notas e reviews",
    description: "Dê nota de 1 a 10 e escreva resenhas que ajudam outros fãs.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Discussão sem spoiler",
    description:
      "Cada episódio tem seu tópico, e você só vê até onde já assistiu.",
  },
  {
    icon: CalendarIcon,
    title: "Temporada atual",
    description: "Tudo o que está passando agora, atualizado todo dia.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-4 py-8">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Sua lista de animes.{" "}
          <span className="text-primary">Sua comunidade.</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Acompanhe o que você assiste, dê notas e discuta cada episódio com
          quem está no mesmo ponto que você.
        </p>
        <div className="flex gap-2">
          <Button asChild size="lg">
            <Link href="/cadastro">Criar minha lista</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/temporada">Ver temporada</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="text-primary mb-2 size-5" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <HomeShelves />
    </div>
  );
}

// dados em cache ("use cache" nas consultas), então entram no HTML estático
async function HomeShelves() {
  const season = await getCurrentSeason();
  const [seasonAnimes, topAnimes] = await Promise.all([
    getSeasonAnimes(season, 12),
    getTopRated(12),
  ]);

  return (
    <>
      <Shelf
        title={`Temporada de ${seasonLabel(season)}`}
        href="/temporada"
        animes={seasonAnimes}
      />
      <Shelf title="Mais bem avaliados" href="/top" animes={topAnimes} />
    </>
  );
}

function Shelf({
  title,
  href,
  animes,
}: {
  title: string;
  href: string;
  animes: AnimeCardData[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-primary text-sm hover:underline">
          Ver tudo
        </Link>
      </div>
      <AnimeGrid animes={animes} />
    </section>
  );
}
