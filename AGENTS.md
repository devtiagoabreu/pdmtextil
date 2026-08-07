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

## Backup/Restore e fix de FKs (2026-08-06)

- **Causa raiz**: `scripts/backup-db.mjs` remove colunas com default `nextval`; `scripts/restore-db.mjs` restaura com FKs dormentes → ids renumerados e referências de FKs apontando para ids antigos (corrompidos).
- **Fix aplicado**: `scripts/fix-remap.mjs` gera `backups/fix-fk-remap.sql` (33 seções, 8538 tuplas) aplicado por `scripts/apply-fix.mjs` (transação única + DROP/ADD do constraint `crm_cidades_nome_estado_id_key` + DELETE `user_email_config` id=1). Backup pré-fix: `backups/pre-fix-2026-08-06.sql`.
- **Pós-fix**: 0 órfãos nas 49 FKs declaradas (`scripts/diag-orphans-final.js`). Decisões: `chat_participantes` id=96 `ultima_mensagem_lida_id`→NULL; `chat_leituras` id=325 `mensagem_id`→26 (sucessor real da neon 50 = main 26, chat 10). `user_menu_itens` id=713 (`user_menu_id`=19) deixado intacto — quebrado na origem (menu 19 não existe em nenhum banco).
- **Diagnósticos auxiliares**: `scripts/diag-*.js` (mensagem 50, colisões de cidades, duplicatas, órfãos pós-fix, email config, etc.).
- Se o fix for refeito (novo backup/restore), use o mesmo fluxo e SEMPRE re-sincronize os 4 bancos (`node scripts/sync-all-dbs.js`).

# Testes

Suíte de regressão com **vitest + Testing Library** (jsdom por arquivo via comentário `// @vitest-environment jsdom`).

## REGRA OBRIGATÓRIA: toda funcionalidade/tela exige teste

**Nenhuma funcionalidade ou tela nova pode ser entregue sem teste.** Ao criar ou alterar uma página, componente, API route ou lógica reutilizável:

1. **Páginas de lista/form seguindo o padrão de cadastros** → use as factories `list-page-spec`/`form-page-spec` (na pasta `src/test/`) com config na página do teste.
2. **Telas/componentes atípicos** → teste customizado na pasta da página (jsdom, fetch mock via `harness.tsx`).
3. **API routes** → teste com fetch mock/`routeJson` cobrindo sucesso e erro.
4. **Lógica reutilizável (`src/lib`)** → teste unitário puro (node, sem jsdom quando não houver DOM).

O teste deve ser criado **na mesma entrega/commit** da funcionalidade. Regressão da suíte completa (`npm run test`) é critério de aceite: **toda mudança precisa manter a suíte verde**.

## Fluxo obrigatório ao modificar o código

**Qualquer modificação no sistema (feature, bug fix, refactor) segue esta ordem — sem exceção:**

1. **Alterar o código** (tela/componente/API route/lógica).
2. **Atualizar/criar o teste** daquilo que mudou, na mesma entrega:
   - Teste já existe → ajuste-o para refletir o novo comportamento (novo endpoint, textos, campos, fluxos).
   - Não existe → crie seguindo o padrão da seção acima (factory, smoke ou custom).
3. **Rodar o teste do arquivo** modificado: `npx.cmd vitest run <caminho-do-teste>`.
4. **Rodar a suíte completa**: `npm run test` — **não commitar enquanto estiver vermelha**. Se quebrou:
   - Verificar se a quebra é da mudança → corrigir o código OU o teste (decidir pelo que está certo: se o comportamento mudou de propósito, o teste é que deve ser atualizado).
   - Verificar se a quebra é pré-existente/fora do escopo → reportar ao usuário, não mascarar com `.skip`/`.only`.
5. **Só então commitar** — teste verde na mesma entrega do código.
6. **Tela nova** → além do teste, registrar no grafo (`graphify-out/`) se aplicável.

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
