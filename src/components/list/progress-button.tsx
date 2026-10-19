"use client";

import { useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveListEntry } from "@/app/actions/list";

// "+1 episódio" com um clique, na página da lista do próprio usuário.
// A action invalida a tag da lista, então a página volta atualizada.
export function ProgressButton({
  animeId,
  progress,
}: {
  animeId: number;
  progress: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon-xs"
      aria-label="Marcar mais um episódio"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await saveListEntry({
            animeId,
            progress: progress + 1,
          });
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      <PlusIcon />
    </Button>
  );
}
