// Cliente da API GraphQL da AniList (https://docs.anilist.co).
// Sem dependência do Next: é usado tanto pelo app quanto pelos scripts em /scripts.

const ENDPOINT = "https://graphql.anilist.co";
// O cabeçalho X-RateLimit-Limit da AniList hoje é 30 requisições/minuto.
const MIN_INTERVAL_MS = 2100;
const MAX_RETRIES = 3;

export type AniListDate = {
  year: number | null;
  month: number | null;
  day: number | null;
};

export type AniListMedia = {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null; native: string | null };
  synonyms: string[];
  description: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: AniListDate;
  endDate: AniListDate;
  source: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  studios: { nodes: { id: number; name: string }[] };
  averageScore: number | null;
  popularity: number | null;
  isAdult: boolean;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
};

export type MediaPage = {
  hasNextPage: boolean;
  media: AniListMedia[];
};

export type MediaFilters = {
  page?: number;
  perPage?: number;
  search?: string;
  season?: string;
  seasonYear?: number;
  idIn?: number[];
  sort?: string[];
};

const MEDIA_PAGE_QUERY = /* GraphQL */ `
  query (
    $page: Int
    $perPage: Int
    $search: String
    $season: MediaSeason
    $seasonYear: Int
    $idIn: [Int]
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(
        type: ANIME
        isAdult: false
        search: $search
        season: $season
        seasonYear: $seasonYear
        id_in: $idIn
        sort: $sort
      ) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        synonyms
        description(asHtml: false)
        format
        status
        episodes
        duration
        season
        seasonYear
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        source
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        genres
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        averageScore
        popularity
        isAdult
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  }
`;

let lastRequestAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    // espaça as chamadas para não estourar o limite por minuto
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? 60);
      await sleep((retryAfter + 1) * 1000);
      continue;
    }

    const body = (await res.json()) as {
      data?: T;
      errors?: { message: string }[];
    };
    if (!res.ok || body.errors?.length || !body.data) {
      const message =
        body.errors?.map((e) => e.message).join("; ") ?? res.statusText;
      throw new Error(`AniList respondeu ${res.status}: ${message}`);
    }
    return body.data;
  }
}

export async function fetchMediaPage(
  filters: MediaFilters,
): Promise<MediaPage> {
  const data = await request<{
    Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] };
  }>(MEDIA_PAGE_QUERY, { page: 1, perPage: 50, ...filters });

  return {
    hasNextPage: data.Page.pageInfo.hasNextPage,
    media: data.Page.media,
  };
}
