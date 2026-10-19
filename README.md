# animalist

Fórum e catálogo de animes no estilo do MyAnimeList. O plano completo está em [PLANEJAMENTO.md](PLANEJAMENTO.md).

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 + shadcn/ui · PostgreSQL 17 · Prisma 7 · Better Auth

## Rodando localmente

Precisa de Node 20+ e Docker Desktop aberto.

```bash
npm install          # também gera o client do Prisma
cp .env.example .env # depois gere o BETTER_AUTH_SECRET (veja abaixo)
npm run db:up        # sobe o Postgres em localhost:5434
npm run db:migrate   # aplica as migrações
npm run anime:import # importa ~1.200 animes da AniList (~1 min)
npm run dev          # http://localhost:3000
```

Gerar o segredo do Better Auth:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Scripts

| Script                                  | O que faz                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                           | Servidor de desenvolvimento                                                                                                                     |
| `npm run build`                         | Build de produção                                                                                                                               |
| `npm run lint` / `typecheck` / `format` | ESLint / TypeScript / Prettier                                                                                                                  |
| `npm run db:up` / `db:down`             | Liga / desliga o Postgres no Docker (os dados ficam no volume)                                                                                  |
| `npm run db:migrate`                    | Cria e aplica migração depois de mudar `prisma/schema.prisma`                                                                                   |
| `npm run db:studio`                     | Abre o Prisma Studio para ver o banco                                                                                                           |
| `npm run anime:import`                  | Importa da AniList: 1.000 populares + temporada atual e próxima. Opções: `-- --paginas 40`, `-- --temporada 2026-outubro`, `-- --so-temporadas` |
| `npm run anime:stats`                   | Recalcula nota ponderada, membros e ranking                                                                                                     |

## Estrutura

```
prisma/schema.prisma        modelos do banco
prisma7.config.ts           config do Prisma 7 (lê DATABASE_URL do .env)
scripts/                    importação e recálculo (rodam com tsx, fora do Next)
src/app/                    rotas (App Router)
  anime/[id]/[[...slug]]/   página do anime
  animes/                   explorar + busca
  temporada/, top/          temporada e rankings
  u/[username]/(lista)/     perfil e lista pública
  configuracoes/            editar perfil / escolher username
  actions/                  Server Actions (lista, perfil)
  api/auth/[...all]/        endpoints do Better Auth
  api/cron/sync/            job diário (vercel.json)
  entrar/, cadastro/        login e cadastro
src/server/                 só servidor: AniList, importador, nota, consultas em cache
src/components/             header, cards de anime, editor da lista, perfil, tema
src/components/ui/          componentes do shadcn/ui (gerados, pode editar)
src/lib/auth.ts             config do Better Auth (servidor)
src/lib/auth-client.ts      client do Better Auth (navegador)
src/lib/session.ts          getCurrentUser() para Server Components
src/lib/db.ts               client do Prisma
src/lib/labels.ts           textos em PT-BR (formatos, status, gêneros…)
src/lib/season.ts           temporadas ("Outubro 2026" = FALL 2026)
src/generated/prisma/       client gerado (não editar, não vai pro git)
```

## Regras importantes do Next 16 neste projeto

- `cacheComponents` está ligado: **ler a sessão (`getCurrentUser`) só dentro de `<Suspense>`**. Fora dele, o build falha.
- Consultas iguais para todo mundo usam `"use cache"` + `cacheTag` (`anime:<id>`, `animes`, `list:<userId>`, `user:<username>`). As Server Actions chamam `updateTag` com a mesma tag.
- `getCurrentUser()` chama `connection()` antes de ler a sessão (o Better Auth usa `new Date()`).
- O build lê o banco (home, top e temporada são pré-renderizadas): o `DATABASE_URL` precisa estar disponível no build.
- Depois de mudar o schema, **reinicie o `npm run dev`**: o client antigo do Prisma fica em memória.
- A documentação da versão instalada fica em `node_modules/next/dist/docs/`. Use ela no lugar de tutoriais antigos.

## Login com Google e Discord

Os botões só aparecem quando as chaves estão no `.env`.

**Google:** [console.cloud.google.com](https://console.cloud.google.com) → APIs e serviços → Credenciais → Criar ID do cliente OAuth (Aplicativo da Web).

- Origem autorizada: `http://localhost:3000`
- URI de redirecionamento: `http://localhost:3000/api/auth/callback/google`

**Discord:** [discord.com/developers/applications](https://discord.com/developers/applications) → New Application → OAuth2.

- Redirect: `http://localhost:3000/api/auth/callback/discord`

Em produção, adicione as mesmas URLs trocando `localhost:3000` pelo domínio.

## Deploy (Vercel + Neon)

1. Suba o projeto para o GitHub.
2. Crie um banco em [neon.tech](https://neon.tech) e copie a connection string (com `?sslmode=require`).
3. Aplique as migrações no Neon: troque temporariamente o `DATABASE_URL` do `.env` pela URL do Neon, rode `npx prisma migrate deploy` e `npm run anime:import`, e depois volte o valor local. Faça isso **antes** do primeiro deploy: o build lê o banco.
4. Em [vercel.com/new](https://vercel.com/new), importe o repositório e configure as variáveis: `DATABASE_URL`, `BETTER_AUTH_SECRET` (gere um novo), `BETTER_AUTH_URL` (a URL da Vercel), `CRON_SECRET` (gere um novo) e as chaves OAuth.
5. O `vercel.json` agenda `/api/cron/sync` todo dia às 6h UTC (atualiza animes em exibição e as temporadas).

## Dados de anime

Fornecidos pela [AniList](https://anilist.co) (uso não comercial). Ver seção 3 do PLANEJAMENTO.md.
