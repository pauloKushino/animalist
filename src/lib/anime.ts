import { formatLabels } from "@/lib/labels";

type AnimeTitleFields = { titleEnglish: string | null; titleRomaji: string };

// O título em inglês é o mais conhecido no Brasil ("Attack on Titan");
// o romaji aparece como título secundário na página do anime.
export function animeTitle(anime: AnimeTitleFields) {
  return anime.titleEnglish ?? anime.titleRomaji;
}

export function animeHref(anime: { id: number; slug: string }) {
  return `/anime/${anime.id}/${anime.slug}`;
}

export function animeMeta(anime: {
  format: string | null;
  episodes: number | null;
}) {
  const parts = [];
  if (anime.format) parts.push(formatLabels[anime.format] ?? anime.format);
  if (anime.format !== "MOVIE") {
    parts.push(
      anime.episodes
        ? `${anime.episodes} ep${anime.episodes > 1 ? "s" : ""}`
        : "? eps",
    );
  }
  return parts.join(" · ");
}
