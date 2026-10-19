import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-primary text-6xl font-bold">404</p>
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-sm">
        Esse link não existe ou o conteúdo foi removido.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Ir para o início</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/animes">Buscar animes</Link>
        </Button>
      </div>
    </div>
  );
}
