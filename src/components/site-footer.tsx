export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm sm:flex-row sm:justify-between">
        <p>animalist — projeto de fã, sem fins lucrativos.</p>
        <p>
          Dados de animes fornecidos por{" "}
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-4"
          >
            AniList
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
