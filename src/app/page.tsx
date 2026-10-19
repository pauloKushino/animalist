import Link from "next/link";
import {
  CalendarIcon,
  ListChecksIcon,
  MessagesSquareIcon,
  StarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    </div>
  );
}
