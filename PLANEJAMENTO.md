# Animalist 2.0 — Planejamento

Fórum e catálogo de animes no estilo do MyAnimeList: cada usuário mantém sua lista, dá notas, escreve reviews, discute episódios e acompanha amigos.

**Objetivo:** começar como projeto de portfólio bem feito, mas com arquitetura que aguente virar uma comunidade real.

---

## 1. Diferenciais (por que alguém usaria isso em vez do MAL?)

Copiar o MAL não basta. Algumas ideias para escolher 2–3 e caprichar:

| Ideia                              | Por quê                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Feito para o público BR**        | Interface em PT-BR, sinopses traduzidas, onde assistir no Brasil (Crunchyroll, Netflix, etc.). |
| **Spoiler por episódio**           | O usuário só vê discussões até o episódio em que parou na lista dele. O MAL não faz isso.      |
| **Tópico automático por episódio** | Cada episódio novo gera um tópico de discussão (como o r/anime faz).                           |
| **UI moderna e rápida**            | O MAL tem visual de 2008. Modo escuro, mobile primeiro, carregamento instantâneo.              |
| **Estatísticas bonitas**           | "Seu ano em animes", gêneros favoritos, horas assistidas, gráfico de notas.                    |

> Recomendo começar com **spoiler por episódio + tópico por episódio + UI moderna**. São fáceis de explicar e difíceis de achar em outros sites.

---

## 2. Stack

| Camada             | Escolha                                          | Motivo                                                                                                                                            |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | **Next.js (App Router) + TypeScript**            | Front e back no mesmo projeto, SSR bom para SEO (páginas de anime precisam aparecer no Google).                                                   |
| Banco              | **PostgreSQL**                                   | Relacional, ideal para listas, notas e fórum.                                                                                                     |
| ORM                | **Prisma**                                       | Schema legível, migrações, tipos automáticos.                                                                                                     |
| Auth               | **Better Auth**                                  | Login com e-mail/usuário + Google/Discord. Escolhido no lugar do Auth.js, cujo v5 nunca saiu do beta e hoje é mantido pela equipe do Better Auth. |
| UI                 | **Tailwind CSS + shadcn/ui**                     | Rápido de construir, visual consistente.                                                                                                          |
| Validação          | **Zod**                                          | Valida todo input do usuário (forms e API).                                                                                                       |
| Busca              | **Postgres full-text + `pg_trgm`**               | Suficiente no começo; Meilisearch depois, se precisar.                                                                                            |
| Testes             | **Vitest** (unidade) + **Playwright** (fluxos)   |                                                                                                                                                   |
| Hospedagem         | **Vercel** + **Neon** ou **Supabase** (Postgres) | Free tier cobre o portfólio; escala paga se crescer.                                                                                              |
| Imagens de usuário | **Cloudflare R2** ou **Supabase Storage**        | Avatares e banners.                                                                                                                               |

---

## 3. Dados dos animes

**Fonte principal: AniList GraphQL API** (`https://graphql.anilist.co`)

- Dados ricos: títulos, sinopse, episódios, estúdios, gêneros, temporada, capa, banner, relações (sequência/prequel), personagens.
- Limite: ~90 req/min. Traz o ID do MAL junto (`idMal`), útil para cruzar dados.
- ⚠️ Termos de uso: livre para uso **não comercial**. Se monetizar, precisa falar com a AniList.

**Alternativa / complemento: Jikan v4** (API não oficial do MAL)

- Limite: 3 req/s, 60 req/min. Útil se quiser dados no formato exato do MAL.

**Estratégia:**

1. **Seed inicial:** script que importa as ~2.000 obras mais populares + temporada atual.
2. **Sob demanda:** se o usuário buscar algo que não está no banco, busca na AniList e salva.
3. **Job diário (cron):** atualiza animes "em exibição" (episódios novos, status).
4. Nunca chamar a API externa a cada visita de página. Sempre servir do nosso banco.

---

## 4. Modelo de dados (rascunho)

```
User ──< ListEntry >── Anime ──< AnimeGenre >── Genre
  │                      │
  │                      ├──< Episode
  │                      ├──< AnimeStudio >── Studio
  │                      └──< Review ──< ReviewVote
  │
  ├──< Follow (seguidor → seguido)
  ├──< Activity (feed)
  ├──< Notification
  │
  └──< Post >── Topic >── Board (fórum geral) ou Anime/Episode (discussão)
```

**Entidades principais:**

- **User**: username, nome, avatar, bio, role (`USER` / `MOD` / `ADMIN`), criado em.
- **Anime**: anilistId, malId, títulos (romaji/inglês/nativo), sinopse, tipo (TV/Filme/OVA), episódios, status, temporada/ano, capa, banner, **média ponderada**, número de membros.
- **ListEntry**: user + anime (único), status (`WATCHING`, `COMPLETED`, `ON_HOLD`, `DROPPED`, `PLAN_TO_WATCH`), nota (1–10, opcional), episódios vistos, datas de início/fim, rewatch, notas privadas.
- **Review**: user + anime (única por par), texto, nota, flag de spoiler, contagem de votos "útil".
- **Board**: fóruns gerais (Notícias, Recomendações, Off-topic…).
- **Topic**: título, autor, board **ou** anime **ou** episódio, fixado/trancado.
- **Post**: conteúdo (Markdown sanitizado), autor, tópico, resposta a outro post, editado em.
- **Follow**, **Activity** ("Fulano completou X e deu nota 9"), **Notification**, **Report** (denúncias para moderação).

**Nota do anime (igual ao MAL):** média bayesiana para evitar que um anime com 3 votos 10 fique no topo:

```
nota = (v / (v + m)) * R + (m / (v + m)) * C
v = nº de votos do anime, R = média do anime,
m = mínimo de votos (ex.: 50), C = média geral do site
```

Recalcular por job periódico, não a cada voto.

---

## 5. Páginas

| Rota                                       | Conteúdo                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `/`                                        | Temporada atual, em alta, últimas discussões, feed dos amigos (se logado). |
| `/anime/[id]/[slug]`                       | Detalhes, botão "adicionar à lista", nota, reviews, tópicos, relacionados. |
| `/anime/[id]/episodio/[n]`                 | Discussão do episódio (com bloqueio de spoiler).                           |
| `/busca`                                   | Busca com filtros (gênero, ano, temporada, tipo, status).                  |
| `/temporada/[ano]/[estacao]`               | Grade da temporada.                                                        |
| `/top`                                     | Ranking por nota ponderada e por popularidade.                             |
| `/u/[username]`                            | Perfil, estatísticas, favoritos, atividade.                                |
| `/u/[username]/lista`                      | Lista completa com abas por status.                                        |
| `/forum`, `/forum/[board]`, `/topico/[id]` | Fórum.                                                                     |
| `/reviews/[id]`                            | Review individual.                                                         |
| `/notificacoes`, `/configuracoes`          | Área do usuário.                                                           |
| `/admin`                                   | Denúncias, banimentos, gerenciar boards.                                   |

---

## 6. Roadmap em fases

Cada fase termina com algo funcionando e no ar.

### Fase 0 — Fundação (≈1 semana)

- [x] Criar projeto Next.js 16 + TS + Tailwind 4 + shadcn/ui, ESLint, Prettier
- [x] Postgres local (Docker, porta 5434) + Prisma 7 + primeira migração
- [x] Better Auth: cadastro/login por e-mail ou usuário (Google/Discord prontos, faltam as chaves)
- [x] Layout base (header, busca, menu do usuário, modo escuro, nav mobile)
- [ ] Criar chaves OAuth do Google e do Discord (precisa da sua conta)
- [ ] Deploy na Vercel + Neon (precisa da sua conta; passo a passo no README)
- [ ] Repositório git + GitHub

### Fase 1 — Catálogo + Lista pessoal (≈2 semanas) ⭐ núcleo do produto

- [ ] Script de importação da AniList (seed) + job de atualização
- [ ] Página do anime, busca, temporada, top
- [ ] Adicionar à lista, mudar status, nota, progresso (+1 episódio com um clique)
- [ ] Página da lista do usuário com abas e ordenação
- [ ] Nota ponderada e contagem de membros

### Fase 2 — Fórum (≈2 semanas)

- [ ] Boards gerais, tópicos, respostas, citação
- [ ] Tópico por anime e por episódio (criado automaticamente)
- [ ] Editor Markdown com tag `[spoiler]` e sanitização (anti-XSS)
- [ ] **Bloqueio de spoiler pelo progresso da lista**
- [ ] Paginação, tópicos fixados/trancados

### Fase 3 — Reviews (≈1 semana)

- [ ] Escrever/editar review (mínimo de caracteres, exige o anime na lista)
- [ ] Voto "útil", ordenação por mais úteis/recentes

### Fase 4 — Social (≈1–2 semanas)

- [ ] Perfil público com estatísticas (gráficos de gêneros, notas, horas)
- [ ] Seguir usuários, feed de atividade
- [ ] Notificações (resposta no tópico, novo seguidor, menção `@user`)
- [ ] Favoritos (animes e personagens)

### Fase 5 — Pronto para comunidade real

- [ ] Moderação: denúncias, fila de mod, ban/mute, log de ações
- [ ] Rate limiting (posts, cadastro, login) e captcha no cadastro
- [ ] LGPD: termos, política de privacidade, exportar e excluir conta
- [ ] SEO: metadata, Open Graph com capa do anime, sitemap
- [ ] Monitoramento de erros (Sentry) e backups do banco

**Total estimado:** ~8–10 semanas em ritmo de projeto pessoal.

---

## 7. Segurança e cuidados

- Todo input validado com Zod no servidor; Markdown renderizado com sanitização (ex.: `rehype-sanitize`).
- Checagem de permissão em toda ação (só o autor edita o próprio post; só mod tranca tópico).
- Rate limit em rotas de escrita.
- Nunca expor e-mail de usuários; perfil pode ser privado.
- Segredos só em variáveis de ambiente (`.env` fora do git).
- Imagens da AniList: usar a URL do CDN deles com `next/image`; não re-hospedar sem necessidade.

---

## 8. Ideias para depois (v2+)

- Mangá (a AniList também tem)
- Recomendações personalizadas ("quem gostou de X também gostou de Y")
- Importar lista do MAL/AniList (XML do MAL / API da AniList)
- Clubes/grupos, listas customizadas ("Top 10 isekai")
- App mobile (PWA primeiro)
- Calendário de lançamentos com notificação de episódio novo

---

## 9. Próximo passo

Começar a **Fase 0**: criar o projeto, subir o Postgres no Docker, configurar Prisma e Auth e fazer o primeiro deploy.
