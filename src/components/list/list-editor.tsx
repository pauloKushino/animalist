"use client";

import { useState, useTransition } from "react";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  removeListEntry,
  saveListEntry,
  type ListEntryState,
} from "@/app/actions/list";
import {
  LIST_STATUSES,
  listStatusLabels,
  scoreLabels,
  type ListStatusName,
} from "@/lib/labels";

const SCORES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export function ListEditor({
  animeId,
  episodes,
  initial,
}: {
  animeId: number;
  episodes: number | null;
  initial: ListEntryState | null;
}) {
  const [entry, setEntry] = useState(initial);
  const [pending, startTransition] = useTransition();

  function run(
    action: () => ReturnType<typeof saveListEntry>,
    optimistic: ListEntryState | null,
  ) {
    const previous = entry;
    setEntry(optimistic);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setEntry(previous);
        toast.error(result.error);
        return;
      }
      setEntry(result.entry);
    });
  }

  function save(changes: Partial<ListEntryState>) {
    const base = entry ?? {
      status: "PLAN_TO_WATCH" as const,
      score: null,
      progress: 0,
    };
    run(() => saveListEntry({ animeId, ...changes }), { ...base, ...changes });
  }

  function remove() {
    if (!window.confirm("Remover este anime da sua lista?")) return;
    run(() => removeListEntry(animeId), null);
  }

  if (!entry) {
    return (
      <Select
        onValueChange={(status) => save({ status: status as ListStatusName })}
      >
        <SelectTrigger
          className="w-full"
          disabled={pending}
          aria-label="Adicionar à lista"
        >
          <SelectValue placeholder="+ Adicionar à lista" />
        </SelectTrigger>
        <SelectContent>
          {LIST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {listStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const atEnd = episodes !== null && entry.progress >= episodes;

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <Select
        value={entry.status}
        onValueChange={(status) => save({ status: status as ListStatusName })}
      >
        <SelectTrigger className="w-full" aria-label="Status na lista">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LIST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {listStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={entry.score === null ? "none" : String(entry.score)}
        onValueChange={(value) =>
          save({ score: value === "none" ? null : Number(value) })
        }
      >
        <SelectTrigger className="w-full" aria-label="Sua nota">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sem nota</SelectItem>
          {SCORES.map((score) => (
            <SelectItem key={score} value={String(score)}>
              {score} · {scoreLabels[score]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Episódio anterior"
          disabled={entry.progress <= 0}
          onClick={() => save({ progress: entry.progress - 1 })}
        >
          <MinusIcon />
        </Button>
        <span className="text-sm tabular-nums">
          Ep. <strong>{entry.progress}</strong> / {episodes ?? "?"}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Próximo episódio"
          disabled={atEnd}
          onClick={() => save({ progress: entry.progress + 1 })}
        >
          <PlusIcon />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        disabled={pending}
        onClick={remove}
      >
        <Trash2Icon /> Remover da lista
      </Button>
    </div>
  );
}
