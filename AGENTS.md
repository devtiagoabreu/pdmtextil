# Graphify Knowledge Graph

O projeto tem um grafo de conhecimento em `graphify-out/` com 2599 nós, 6179 arestas e 82 comunidades.

## Como usar

- **Consulta rápida**: carregue `graphify-out/GRAPH_REPORT.md` (326 linhas) para visão geral das comunidades
- **Consulta detalhada**: carregue `graphify-out/graph.json` e pesquise nós/arestas para entender dependências entre arquivos
- **Perguntas específicas**: aponte o nome do nó (ex: `requireAuth`, `getInfoContent`, `prisma`) que eu encontro no grafo

Sempre consulte o grafo ANTES de responder perguntas sobre arquitetura, fluxos ou dependências do código.

# Multi-Database Setup

O projeto utiliza **4 bancos de dados PostgreSQL**:

| Banco | Uso | Variável |
|---|---|---|
| `pdm_textil` | Instância principal | `DATABASE_URL` |
| `pdm_pro_textil` | PDM Pro Têxtil (produção) | `DATABASE_URL_PDM_PRO_TEXTIL` |
| `pdm_ibirapuera` | PDM Ibirapuera (produção) | `DATABASE_URL_PDM_IBIRAPUERA` |
| Neon | Banco auxiliar Neon (produção) | `DATABASE_URL_NEON` |

## IMPORTANTE: Replicação de Mudanças

**TODA mudança no schema do banco `pdm_textil` DEVE ser replicada para TODOS os outros 3 bancos.**

### Procedimento obrigatório:

1. Crie a migration: `npx drizzle-kit generate`
2. Aplique no principal: `npm run db:migrate`
3. **Replicate para os 3 secundários**: `npm run db:migrate:all`
4. **Neon também**: rode `node scripts/sync-all-dbs.js` (cria colunas/tabelas faltantes com IF NOT EXISTS)

### Para alterações manuais de schema (SQL direto):

Se precisar rodar SQL manualmente (ALTER TABLE, CREATE TABLE, etc.), execute em TODOS:
- `pdm_textil` (principal)
- `pdm_pro_textil`
- `pdm_ibirapuera`
- Neon (`DATABASE_URL_NEON`)

### Verificação de integridade:

```bash
node scripts/compare-schemas.js
```

Compara colunas entre os 4 bancos e lista diferenças.

# Testes

Suíte de regressão com **vitest + Testing Library** (jsdom por arquivo via comentário `// @vitest-environment jsdom`).

## Comandos

- Suíte completa: `npm run test` (ou `npx.cmd vitest run`)
- Módulo de cadastros: `npx.cmd vitest run "src/app/(dashboard)/cadastros"`
- Arquivo único: `npx.cmd vitest run <caminho>`
- Watch: `npm run test:watch`

> **Windows**: use `npx.cmd`/`npm.cmd` (ExecutionPolicy bloqueia `.ps1`).

## Infra

- `vitest.config.ts` — `environment: "node"` global; páginas/componentes declaram jsdom por arquivo.
- `src/test/harness.tsx` — `renderPage()` (com QueryClientProvider, `retry:false`), `createFetchMock(handler)` (mock global de fetch com `{calls}` e `findCall(calls,url,method?)`), `navMock` (`router.push/replace/back/prefetch`, `params`, `pathname`, `reset`), `toastMock`, `routeJson(routes)`. A URL no mock é **exata** (query string inclusa).
- `src/test/setup.tsx` — mocka `next/navigation`, `next/link` (→ `<a>`), `sonner` (→toastMock); beforeEach reseta mocks, stuba `alert`/`confirm` (confirm→true) e stubs de ResizeObserver/IntersectionObserver/matchMedia/scrollIntoView. **Só roda em jsdom** (guarda `typeof window !== "undefined"`).

## Factories (páginas de cadastros)

- `src/test/list-page-spec.tsx` — 6 testes por lista (renderiza+status, busca, estado vazio, exclui+modal, bloqueio fkError, links novo/edição). Badges contadas com `{ selector: "span" }`; bloqueio usa regex `/não pode ser exclu/`; botão da linha: `getAllByRole("button").find(b => !b.closest("a"))`.
- `src/test/form-page-spec.tsx` — 4 testes por formulário (renderiza novo, valida obrigatórios, cria via POST, edição via PUT). Config inclui `headingNew/headingEdit`, `validationToast`, `successToastNew/Edit`, `editId/editData/editDisplayValue`, `createFields` (placeholder+value), `createBodyAssert`. Labels padrão "Criar"/"Atualizar" (`submitNewLabel`/`submitEditLabel`).

## Padrões importantes

- Testes de página: sempre `navMock.setPathname(...)` e, quando há `:id`, `navMock.setParams({ id })`.
- Validação de `required` no jsdom: **não clique no submit** — dispare `fireEvent.submit(form)` diretamente (`form = container.querySelector("form")!`).
- Edição: `await screen.findByRole("heading", { name: headingEdit })` e `await screen.findByDisplayValue(...)` (o fetch resolve depois do render).
- Formulários atípicos (sem `<form>`, `alert`/`confirm`): teste customizado na pasta da página — ex. `produtos-quimicos/[id]/form.test.tsx`.
- Caso especial: `receitas` (abas), `produto-cru/[id]` (multi-tab, smoke de Capa).
