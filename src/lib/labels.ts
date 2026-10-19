// Textos em PT-BR para os valores que vêm da AniList e para a lista.
// Sem dependências de servidor: pode ser usado em Client Components.

export const formatLabels: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV curta",
  MOVIE: "Filme",
  SPECIAL: "Especial",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Clipe musical",
};

export const statusLabels: Record<string, string> = {
  FINISHED: "Finalizado",
  RELEASING: "Em exibição",
  NOT_YET_RELEASED: "Ainda não lançado",
  CANCELLED: "Cancelado",
  HIATUS: "Em hiato",
};

export const sourceLabels: Record<string, string> = {
  ORIGINAL: "Original",
  MANGA: "Mangá",
  LIGHT_NOVEL: "Light novel",
  VISUAL_NOVEL: "Visual novel",
  VIDEO_GAME: "Jogo",
  GAME: "Jogo",
  NOVEL: "Livro",
  WEB_NOVEL: "Web novel",
  DOUJINSHI: "Doujinshi",
  ANIME: "Anime",
  LIVE_ACTION: "Live action",
  COMIC: "Quadrinhos",
  MULTIMEDIA_PROJECT: "Projeto multimídia",
  PICTURE_BOOK: "Livro ilustrado",
  OTHER: "Outro",
};

const genreLabels: Record<string, string> = {
  Action: "Ação",
  Adventure: "Aventura",
  Comedy: "Comédia",
  Drama: "Drama",
  Ecchi: "Ecchi",
  Fantasy: "Fantasia",
  Horror: "Terror",
  "Mahou Shoujo": "Garota mágica",
  Mecha: "Mecha",
  Music: "Música",
  Mystery: "Mistério",
  Psychological: "Psicológico",
  Romance: "Romance",
  "Sci-Fi": "Ficção científica",
  "Slice of Life": "Cotidiano",
  Sports: "Esportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspense",
};

export function genreLabel(name: string) {
  return genreLabels[name] ?? name;
}

// ---------------------------------------------------------------------------
// Lista pessoal
// ---------------------------------------------------------------------------

export const LIST_STATUSES = [
  "WATCHING",
  "COMPLETED",
  "ON_HOLD",
  "DROPPED",
  "PLAN_TO_WATCH",
] as const;
export type ListStatusName = (typeof LIST_STATUSES)[number];

export const listStatusLabels: Record<ListStatusName, string> = {
  WATCHING: "Assistindo",
  COMPLETED: "Completo",
  ON_HOLD: "Pausado",
  DROPPED: "Droppado",
  PLAN_TO_WATCH: "Planejo assistir",
};

// usado na URL: /u/fulano/lista?status=assistindo
export const listStatusSlugs: Record<ListStatusName, string> = {
  WATCHING: "assistindo",
  COMPLETED: "completos",
  ON_HOLD: "pausados",
  DROPPED: "droppados",
  PLAN_TO_WATCH: "planejados",
};

export function listStatusFromSlug(slug: string | undefined) {
  const entry = Object.entries(listStatusSlugs).find(
    ([, value]) => value === slug,
  );
  return entry ? (entry[0] as ListStatusName) : undefined;
}

// mesma escala do MyAnimeList
export const scoreLabels: Record<number, string> = {
  10: "Obra-prima",
  9: "Ótimo",
  8: "Muito bom",
  7: "Bom",
  6: "Razoável",
  5: "Mediano",
  4: "Ruim",
  3: "Muito ruim",
  2: "Horrível",
  1: "Péssimo",
};

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

const numberFormat = new Intl.NumberFormat("pt-BR");
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export const formatNumber = (value: number) => numberFormat.format(value);
export const formatDate = (date: Date) => dateFormat.format(date);
// horário de Brasília, para "próximo episódio"
export const formatDateTime = (date: Date) => dateTimeFormat.format(date);
export const formatScore = (score: number | null) =>
  score === null ? "—" : score.toFixed(2).replace(".", ",");
