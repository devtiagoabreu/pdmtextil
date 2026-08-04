---
name: pdm-dev
description: Convenções, padrões de código e arquitetura do PDM Pro Têxtil (Next.js 15 App Router + Drizzle ORM + PostgreSQL). Use SEMPRE ao desenvolver, corrigir, refatorar ou explicar código deste repositório — listas, API routes, schema/DB, menus, telas, ícones, testes e validação.
---

# PDM Pro Têxtil — Skill de Desenvolvimento

Regras e padrões obrigatórios para trabalhar no código deste repositório. Siga estas convenções em **todo** código novo e ao modificar código existente (imite o estilo dos vizinhos).

## 1. Stack e Visão Geral

- **Next.js 15** (App Router), **React 19**, TypeScript strict, Tailwind CSS 3.
- **Drizzle ORM** (`drizzle-orm/postgres-js`) sobre **PostgreSQL** — `postgres-js`, `prepare: false`.
- **NextAuth v4** (Credentials + Google), estratégia JWT, `maxAge` 30 dias.
- Dados no cliente: **TanStack Query**. Formulários: **react-hook-form** + **zod**. Toasts: **sonner**.
- UI: componentes shadcn/Radix em `src/components/ui/*`; alguns componentes `@base-ui/react`.
- Ícones: **lucide-react** `^1.17.0`.
- Testes: **vitest** (`src/lib/*.test.ts`). PDFs: `jspdf` + `jspdf-autotable`; exportação Excel via `@/components/exportar/ExportarDados`.
- Linguagem do sistema: **pt-BR** — toda UI, erro, toast e rótulo em português.
- Repo: `github.com/devtiagoabreu/pdmtextil`, branch `main`.

## 2. Estrutura de Diretórios

```
src/
├── app/                    # App Router
│   ├── (dashboard)/        # área autenticada (admin, amostras, bi, cadastros, chat, comercial, dashboard, documentos, ferramentas, perfil)
│   ├── api/                # route handlers (uma subpasta por recurso)
│   ├── kanban-*/           # telas kanban standalone
│   ├── login/              # página pública
│   ├── layout.tsx          # root layout
│   └── middleware.ts       # proteção de rotas (ver §7)
├── components/
│   ├── ui/                 # primitivos: button, input, select, dialog, tabs, list-filters, ...
│   └── <dominio>/          # componentes de domínio (bi, crm, kanban, exportar, importar, integracao, ...)
├── hooks/                  # hooks customizados
├── lib/
│   ├── db/
│   │   ├── index.ts        # exporta `db` (drizzle)
│   │   ├── schema/*.ts     # 1 arquivo por domínio/entidade; barrel em schema/index.ts
│   │   └── migrations/     # geradas por drizzle-kit
│   ├── auth.ts             # authOptions, getServerSession, requireAuth, getUserId
│   ├── validation.ts       # schemas zod (validateRequest)
│   ├── api-error.ts        # handleApiError, getErrorMessage
│   ├── pagination.ts       # cursor pagination helpers
│   ├── notificar.ts        # logs + notificação de erros
│   ├── sanitize.ts         # sanitização (DOMPurify)
│   ├── search-registry.ts  # registro manual de telas (command palette + menus)
│   ├── telas-disponiveis.ts# auto-descoberta de páginas via fs
│   ├── menu-icones.tsx     # registro central de ícones de menu
│   ├── info-content.ts     # textos de ajuda por rota (getInfoContent)
│   └── <dominio>/*         # lógica de domínio (ai/, bi/, crm-timeline.ts, google-calendar.ts, whatsapp/, ...)
└── types/                  # types globais (.d.ts, módulos)
```

## 3. Convenções de Código

- **Sem comentários** no código novo, a menos que o usuário peça. Nomes claros bastam.
- Path alias `@/*` → `src/*`. Importe relativo apenas dentro do mesmo arquivo/componente.
- Arquivos `kebab-case.ts`; componentes PascalCase; hooks/funções camelCase; tipos PascalCase.
- Prettier já configurado (`npm run format`). Mantenha estilo do arquivo ao editar.
- Texto de UI/erros sempre **pt-BR**, com acentos corretos.
- Prefira `export function` nomeado; default export apenas em `page.tsx`/`layout.tsx`.
- Ao criar componente de UI reutilizável, coloque em `src/components/ui/` e use os padrões cva/clsx já usados lá.

## 4. Páginas e Rotas

- Página de área autenticada fica em `src/app/(dashboard)/<modulo>/<rota>/page.tsx`. O `(dashboard)/layout.tsx` provê o shell (sidebar etc.).
- Se a rota é protegida e fica numa **área nova**, adicione o prefixo no `matcher` de `src/middleware.ts` (ver §7).
- **Toda página nova** deve aparecer na configuração de menus e na busca. Dois mecanismos:
  1. **Auto-descoberta** (`telas-disponiveis.ts`): `page.tsx` estático é descoberto automaticamente (rota `/x`, módulo derivado). Telas dinâmicas (`[id]`) e `/api/*` **não** são descobertas.
  2. **Registro manual** (`search-registry.ts`): adicione `SearchItem` `{id, label, keywords, href, description, module}` para telas dinâmicas (`href` com `[id]`), aliases de busca (ex. `?view=kanban`) e atalhos. `keywords` em pt-BR com sinônimos.
- Se o módulo for novo, mapeie-o em `MODULO_LABELS` em `telas-disponiveis.ts`.
- Detalhe/ficha (`[id]`) e formulário (`nova`, `novo`, `editar`) seguem o padrão do `search-registry.ts` existente.
- Texto de ajuda por tela: adicione entrada em `src/lib/info-content.ts` e renderize `<InfoButton content={info} />` junto ao título (ver §8).

## 5. Padrão de Tela de Lista (Client Component)

Modelo: `src/app/(dashboard)/cadastros/fornecedores/page.tsx`.

- `"use client"` no topo; `useQuery` do TanStack para carregar via `fetch("/api/...")`.
- `queryKey` nomeada (`["fornecedores"]`); `refetch()` após mutações.
- **Busca em todos os campos**: filtre com `matchesSearch(item, search)` de `@/components/ui/list-filters` (recursiva, sem acentos). Não limitar a poucos campos.
- Para status/período/contagem, use `useListFilters(config, data)` + `<ListFilters config={...} filterState={...} />`.
- Estado de loading: `<Loader2 className="animate-spin ..." />` ou `PageSkeleton`/`EmptyState` conforme o caso.
- Exclusão: `ConfirmModal` (variants `danger`/`warning`); se a API retornar `{ fkError: true }`, mostre a mensagem "não pode ser excluído pois possui cadastros vinculados" e bloqueie.
- Ações da listagem: `ExportarDados` (`@/components/exportar/ExportarDados`) e importadores (`@/components/importar/*`, `ImportarApiModal` em `@/components/integracao/ImportarApiModal`) quando fizer sentido.
- Toasts via `sonner` (`toast.success`/`toast.error`).

## 6. Padrão de API Route Handler

Modelo: `src/app/api/cadastros/fornecedores/route.ts`.

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"
import { validateRequest, fornecedorSchema } from "@/lib/validation"
import { handleApiError } from "@/lib/api-error"
import { getPaginationParams, cursorCondition, buildPaginatedResponse } from "@/lib/pagination"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    // ... db.select()...
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/fornecedores")
  }
}
```

- Comece com `export const dynamic = "force-dynamic"` (sem cache em route handler).
- Autenticação: `getServerSession(authOptions)` (401 se ausente). Para operações de dono/usuário use `requireAuth()` de `@/lib/auth` (retorna `{ session, userId }`) ou `getUserId(session)`.
- Validação: `validateRequest(schema, body)` de `@/lib/validation` (zod). Defina o schema zod em `src/lib/validation.ts` (junto aos demais) e reutilize.
- Paginação por cursor: `getPaginationParams(req)` + `cursorCondition(table, cursor)` + `buildPaginatedResponse(rows, limit)` de `@/lib/pagination`.
- Erros: sempre `handleApiError(error, "<VERBO> /api/...")` — trata FK (409) e notifica a equipe.
- CRUD completo: `route.ts` (GET list / POST) + `[id]/route.ts` (GET / PUT / DELETE). DELETE retorna `{ fkError: true }` via `handleApiError` quando houver FK.

## 7. Autenticação e Middleware

- `src/middleware.ts` usa `withAuth` do NextAuth; o `matcher` lista os prefixos protegidos. **Ao criar área protegida nova, atualize o matcher.**
- `src/lib/auth.ts`: `authOptions` (credentials + google), `getServerSession`, `requireAuth()`, `getUserId()`.
- Permissões por role: consulte `src/app/api/admin/*` e schemas `roles.ts`/`user-menus.ts` para o padrão atual. Não invente um sistema paralelo.
- Sessão: JWT. Para acesso a Google Drive/Calendar use o token do provider Google salvo em `accounts`.

## 8. UI e Componentes Reutilizáveis

- Primitivos em `src/components/ui/`: `button`, `input`, `select`, `checkbox`, `radio-group`, `tabs`, `dialog`, `dropdown-menu`, `popover`, `separator`, `label`, `textarea`, `card`, `empty-state`, `page-skeleton`, `confirm-modal`, `info-button`, `page-info-button`, `nav-link`, `sonner`, `list-filters`, `use-statuses`.
- Título de página: `<h1>` + `<InfoButton content={info} />` (de `getInfoContent(pathname)`) + subtítulo `<p className="text-sm text-slate-500 ...">`.
- Toasts: `import { toast } from "sonner"`.
- Tema dark: sempre usar classes `dark:` junto com as claras (ex. `text-slate-900 dark:text-slate-50`).

## 9. Banco de Dados (Drizzle)

- Schema por domínio em `src/lib/db/schema/<dominio>.ts`; exporte tudo no barrel `schema/index.ts`. `db` vem de `@/lib/db`.
- Tabelas nomeadas em snake_case; colunas mapeadas com `column: "nome_coluna"` quando necessário (padrão dos schemas existentes).
- **CRÍTICO — Multi-Database**: o projeto tem 4 Postgres (`pdm_textil`, `pdm_pro_textil`, `pdm_ibirapuera`, Neon). **Toda mudança de schema do `pdm_textil` DEVE ser replicada aos outros 3.** Procedimento:
  1. `npx drizzle-kit generate` → migration em `src/lib/db/migrations/`.
  2. `npm run db:migrate` (principal).
  3. `npm run db:migrate:all` (3 secundários).
  4. `node scripts/sync-all-dbs.js` (Neon, cria tabelas/colunas faltantes com `IF NOT EXISTS`).
  5. Verificação: `node scripts/compare-schemas.js`.
- Migrations de dados (seed/backfill) em `scripts/*` conforme o padrão existente.

## 10. Registro de Telas e Menus

- **`src/lib/search-registry.ts`**: fonte da command palette e base dos menus. Adicione `SearchItem` para cada tela navegável (ver §4).
- **`src/lib/telas-disponiveis.ts`**: `todasTelas()` = registry + descoberta por `fs` de `src/app/**/page.tsx` (ignora `[dinâmicas]`, `api`, route groups). Cacheia em produção.
- **`src/lib/menu-icones.tsx`**: `ENTRADAS: [título pt-BR, nome do ícone lucide, componente][]` + `MenuIcone` para renderizar por nome. Adicione entrada quando criar módulo/área nova.

## 11. Ícones lucide-react (ARMADILHA CONHECIDA)

Sob o `tsconfig.json` do projeto (`skipLibCheck: true`), o tsc **não segue** o bloco `export { ... } from` do `index.d.ts` do lucide-react — imports válidos aparecem como erro `has no exported member`.

- Não "consertar" mexendo no tsconfig/lucide.
- Use **apenas nomes de ícones já validados** (ver a lista em `src/lib/menu-icones.tsx`) ou confirme o nome testando com:
  ```
  node .\node_modules\typescript\bin\tsc --noEmit
  ```
- Se um ícone falhar, troque por um equivalente já presente no `menu-icones.tsx` (ex. `Package`, `Users`, `FileText`, `BarChart3`, `ClipboardList`, `Search`, `Calendar`).

## 12. Comandos e Validação (Windows/PowerShell)

O PowerShell do ambiente bloqueia `npm`/`npx` direto (ExecutionPolicy). Use `cmd /c`.

- Typecheck: `node .\node_modules\typescript\bin\tsc --noEmit` (roda direto; é o comando confiável).
- Dev: `cmd /c "npm run dev"` · Build: `cmd /c "npm run build"`.
- Lint: `cmd /c "npm run lint"` · Formatação: `cmd /c "npm run format"`.
- Testes: `cmd /c "npm run test"` (vitest run). Testes ficam em `src/lib/*.test.ts`.
- Migrations: ver §9.

**Antes de terminar qualquer tarefa**: rode typecheck (`tsc --noEmit`) e, se o escopo tocar UI/rotas, `npm run build`. Rode `npm run test` se tocar lógica testada (`pagination`, `validation`, `api-error`).

## 13. Boas Práticas Next.js 15 (aplicadas aqui)

- **Server Components por padrão**; adicione `"use client"` apenas para interatividade/hooks/browser APIs. Em `route.ts`/Server Components não há hooks.
- **Route Handlers não são cacheados** no Next 15 — o projeto já força `dynamic = "force-dynamic"`. Não adicione caching implícito.
- `params` e `searchParams` em `page.tsx` são `Promise` — sempre `await`.
- Dados que raramente mudam podem usar `fetch` com `next.revalidate`/`tags` + `revalidatePath`/`revalidateTag` — mas no PDM a API sempre responde dinâmico e o TanStack Query cuida do cliente.
- Streaming/Suspense: use `loading.tsx`/`Suspense` para telas pesadas em vez de travar o shell.
- Não faça `fetch` dentro de Client Components direto na render; use TanStack Query (padrão do projeto).

## 14. Arquitetura do Projeto (referência)

- **Monólito modular por domínio**: pastas `cadastros/`, `comercial/`, `crm/`, `bi/`, `admin/`, `amostras/`, `dashboard/` — cada domínio com seu schema, APIs e componentes. Mantenha essa separação; não crie "god modules".
- Camadas respeitadas na prática: UI (client) → API routes (server) → Drizzle (`db`+schema) → PostgreSQL. Validação zod na borda (API), sanitização (`@/lib/sanitize`) antes de renderizar HTML.
- Lógica reutilizável de domínio fica em `src/lib/<dominio>/` ou arquivos `src/lib/<nome>.ts`; componentes de domínio em `src/components/<dominio>/`.
- Evite ciclos de importação entre módulos. Conflito entre arquitetura "ideal" e o padrão real do repo: **siga o padrão real**.
- Ao tomar decisão estrutural relevante, documente (ex. no `AGENTS.md` ou ADR) para não ser repetida/desfeita.

## 15. Checklist de Nova Funcionalidade

Nova entidade/tela completa:
1. Schema Drizzle em `src/lib/db/schema/<dominio>.ts` + barrel em `schema/index.ts`.
2. Migration + replicação nos 4 bancos (§9).
3. Schemas zod em `src/lib/validation.ts` (nome + `Schema`).
4. API: `route.ts` (GET list/POST) + `[id]/route.ts` (GET/PUT/DELETE) com `force-dynamic`, auth, `validateRequest`, `handleApiError`, paginação.
5. Telas: lista (com `matchesSearch`/`useListFilters`), formulário (`/novo`, `/[id]/editar`), detalhe (`/[id]`).
6. Registro: `search-registry.ts` (+ `MODULO_LABELS`/ícone em `menu-icones.tsx` se módulo novo; matcher no middleware se área nova).
7. `info-content.ts` para a tela, quando útil.
8. Validação final: `tsc --noEmit`, `npm run build`, `npm run test`.
9. Exports/imports (Excel/API) e PDFs apenas quando o domínio exigir.
