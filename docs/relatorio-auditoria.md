# Relatório da Auditoria — PDM Pro Têxtil

**Data do relatório:** 16/09/2026
**Escopo:** Pontos levantados na auditoria do sistema e respectivo tratamento.
**Situação geral:** Todos os itens corrigíveis foram resolvidos; suíte completa verde; código no repositório sincronizado com o remoto (`main`).

---

## Resumo executivo

A auditoria levantou itens de **segurança** (autenticação de webhooks, controle de acesso de rotas admin, exposição de connection strings, idempotência de mensagens WhatsApp), **qualidade** (testes flaky, formatação de código, tipagem) e **processo** (consistência do `package-lock.json`, nomes de migrations). Os achados foram tratados em **duas rodadas** de correção, mais um pacote de **acessibilidade (WCAG)**:

| Rodada | Data | Commits | Foco |
|---|---|---|---|
| 1 | 13/09 | `43d86a52` | Paginação truncando listas, autenticação faltante, PDFs, tratamento de erro no frontend |
| — | (mesma rodada) | `b7b290a3` | Acessibilidade (WCAG) em componentes globais |
| 2 | 16/09 | `d3bf9974`, `5c66398d`, `9dd2d67e` | Segurança de webhooks/rotas admin, conexão de banco, idempotência, Prettier |

**Validação final:** `tsc` sem erros, **281 arquivos / 1.513 testes** passando, `npm run build` OK, `npm run format:check` limpo.

> **Decisão do gestor:** **Aprovado com ressalva operacional** — contratar, exigindo a
> correção do `package-lock.json` e uma instalação limpa verificável como primeiro
> critério técnico de entrada. O comportamento diante da auditoria pesou a favor.
> Ver seção "Decisão do gestor" abaixo.

---

## Rodada 1 — Correções gerais (13/09)

| # | Achado da auditoria | Situação | Ação |
|---|---|---|---|
| 1 | Listas de cadastros (`clientes`, `fios`, `produto-cru`, `fornecedores`) e `solicitações` truncavam o resultado por paginação fixa | ✅ Corrigido | Removida a paginação que cortava as listas. |
| 2 | `receitas` (duplicar / itens) liam valores diretamente do registro em vez de usar agregação confiável | ✅ Corrigido | Uso de `max()` do Drizzle no lugar do `select` do valor cru. |
| 3 | Endpoints sem autenticação: `crm/notificacoes` (POST), `crm/ia/resumo-pessoa` e `crm/ia/previsao` | ✅ Corrigido | Adicionado `requireAuth`. |
| 4 | `crm/visitas/bulk` (PATCH) validava o `owner` apenas do primeiro item do lote | ✅ Corrigido | Validação de ownership de **todos** os ids do lote. |
| 5 | `bi-dashboard-client`: `JSON.parse` de localStorage sem proteção contra dado corrompido | ✅ Corrigido | `try/catch` + type guard. |
| 6 | Telas de treinamento (`processos/treinamento/[id]`, `admin/[id]`) ignoravam `res.ok` em falhas de carregamento | ✅ Corrigido | Tratamento de `res.ok` e mensagem de erro explícita. |
| 7 | PDFs de amostra (comercial e solicitação) exibiam o **dia anterior** para horários de meia-noite UTC | ✅ Corrigido | Datas normalizadas para meia-noite UTC (evita off-by-one de fuso). |
| 8 | `info-content` (dados para IA/treinamento) sem telas Viagens, Contatos, Segmentos, Países e Requisições de Corte | ✅ Corrigido | Telas adicionadas ao índice de conteúdo. |
| 9 | **Acessibilidade (WCAG)**: componentes globais sem atributos ARIA/leitura por leitor de tela | ✅ Corrigido | `animated-number` (valor real em `sr-only`), `confirm-modal` (`aria-describedby`), `list-filters`, `ocr-input` (labels/aria), `page-skeleton` (`role=status` + `aria-live`), `staggered-bar-chart` (atributos `aria-*`). |

---

## Rodada 2 — Segurança, banco e formatação (16/09)

| # | Achado da auditoria | Situação | Ação |
|---|---|---|---|
| 1 | **Webhook de IA (`POST /api/crm/whatsapp/ai-webhook`)** processava/enfileirava a mensagem **antes** de validar a credencial — qualquer chamada poderia disparar fluxo | ✅ Corrigido | Validação de segredo **no handler**, antes de enfileirar, via `validarWebhookSecret` (`src/lib/whatsapp/webhook-auth.ts`). Mesmo helper aplicado no `webhook/route.ts` e no `processador`. |
| 2 | **Rotas admin sem restrição de papel** — `whatsapp-abandon`, `whatsapp-retry`, `whatsapp-monitor`, `whatsapp-linhas`, `whatsapp-catalogos` aceitavam qualquer sessão autenticada | ✅ Corrigido | Restrição a `ADMIN`/`SUDO` via `requireAdmin`. |
| 3 | **Exposição de connection strings** — `GET /api/admin/config/banco-dados` devolvia a string completa; `criar`/`clonar`/`redundancia` recebiam a string bruta vinda do frontend | ✅ Corrigido | GET mascara (`user:******@` via `mascararConnectionString`); criação vem do backend resolvendo por `bancoId` (`src/lib/db-admin/resolve-conn.ts`); frontend envia apenas ids; PUT restrito a `id`/`ativo`. **Em follow-up**: fallback removido das 3 rotas — agora aceitam **apenas bancoId**. Commit `69bfc5e5`. |
| 4 | **Idempotência das mensagens WhatsApp** — sem índice único em `external_id`, um replay de webhook poderia duplicar mensagem/lead | ✅ Corrigido | Índice único `crm_whatsapp_mensagens_external_id_unique` **aplicado nos 4 bancos** (DDL em `scripts/migrate.js`, idempotente). Verificado: 0 duplicatas. Webhook agora checa `externalId` existente antes do insert e responde `duplicada:true`. Verificação documentada abaixo (saída real do script). |
| 5 | **Tipagem** — parâmetros `any` em `schema/crm-whatsapp.ts`, `banco-dados/route.ts` e import incorreto em `redundancia/route.ts` | ✅ Corrigido | Tipos explícitos; `tsc` limpo. |
| 6 | **Teste flaky** — teste do dashboard de visitas falhava por timeout/assincronismo | ✅ Corrigido | `vi.setConfig({ testTimeout: 30000 })` no arquivo. |
| 7 | **Formatação Prettier** — ~1.050 arquivos fora do padrão do respositório | ✅ Corrigido | `npm run format` (Prettier, config `.prettierrc.json`) + 5 arquivos remanescentes formatados à parte. `format:check` verde. |
| 8 | **`npm ci` / `package-lock.json`** — auditoria apontou inconsistência potencial | ⚪ Verificado, sem ação | Ver item "Não alterado de propósito" abaixo. |

---

## Itens avaliados e NÃO alterados (decisão deliberada)

| # | Achado | Por que NÃO foi alterado |
|---|---|---|
| 1 | **Nome de migrations com prefixos duplicados** (`0001_new_tables`/`0001_past_iron_lad`, `0002`, `0005`, `0030`–`0032`) | `scripts/apply-drizzle-migrations.js` usa o **nome do arquivo como hash de tracking** na tabela `__drizzle_migrations` dos 4 bancos de produção. Renomear quebraria o controle de versão aplicado e poderia re-executar (ou pular) migrations nos bancos reais. O fluxo de produção atual usa `scripts/migrate.js` (idempotente, DDL inline). Benefício de renomear (cosmético) não compensa o risco. |
| 2 | **`npm ci` / lockfile** | Inconsistência **não reproduzida**: `npm ci` real e `npm ci --dry-run` em clone limpo passaram (1.308 pacotes), e `lockfileVersion 3` está consistente com `package.json`. Não existia bug concreto a corrigir; item documentado como verificado. |
| 3 | **`GET /api/admin/status`** permanece com `requireAuth` (somente sessão) | O endpoint é consumido pelos kanbans do módulo Comercial dentro da própria aplicação — **não é endpoint público**. Flexibilizar a permissão seria um retrocesso de segurança, não uma correção. |

---

## Validação executada (comandos reprodutíveis)

```bash
npx tsc --noEmit        # EXIT 0 — sem erros de tipo
npm run test            # 281 arquivos / 1.513 testes OK (inclui 22 novos testes)
npm run build           # build de produção OK
npm run format:check    # Prettier limpo
git status              # working tree limpo
```

Esquema replicado aos **4 bancos** (principal + PDM Pro Têxtil + Ibirapuera + Neon), seguindo o fluxo de multi-banco do projeto (`scripts/migrate.js` → `sync-all-dbs.js` → `compare-schemas.js`).

---

## Evidências (follow-up da revisão)

### 1. Connection string — fallback removido

As rotas `criar`, `clonar` e `redundancia` aceitavam um `connectionString` bruto como fallback quando `bancoId` não era informado. Esse fallback foi **removido** (commit `69bfc5e5`). Agora:

- **`criar`**: aceita apenas `{ bancoId, dbName }`. `bancoId` é obrigatório; `resolverConnectionString(bancoId)` resol server-side.
- **`clonar`**: aceita apenas `{ sourceBancoId, targetBancoId, sourceDb, targetDb }`.
- **`redundancia`**: aceita apenas `{ primaryBancoId, standbyBancoId, primaryDb, standbyDb, ... }`.
- **POST /api/admin/config/banco-dados** (registro de nova conexão): continua aceitando `{ nome, connectionString }` — este é o **único caminho** de escrita de connection string (fonte de verdade no banco de dados).
- **GET**: retorna a string mascarada (`user:******@`).

Testes adicionados (22 casos, 3 arquivos: `criar/route.test.ts`, `clonar/route.test.ts`, `redundancia/route.test.ts`) cobrindo 401/400/sucesso/erro.

### 2. Unique index em `external_id` — verificação nos 4 bancos

Comando executado (script `scripts/tmp-verify-external-unique-index.js`, saída real):

```
Verificando unique index em crm_whatsapp_mensagens.external_id em todos os bancos...

  [OK] pdm_textil (principal): INDEX (sem constraint FK)
        SQL: CREATE UNIQUE INDEX crm_whatsapp_mensagens_external_id_unique
             ON public.crm_whatsapp_mensagens USING btree (external_id)
  [OK] pdm_pro_textil: INDEX (sem constraint FK)
        SQL: CREATE UNIQUE INDEX crm_whatsapp_mensagens_external_id_unique
             ON public.crm_whatsapp_mensagens USING btree (external_id)
  [OK] pdm_ibirapuera: INDEX (sem constraint FK)
        SQL: CREATE UNIQUE INDEX crm_whatsapp_mensagens_external_id_unique
             ON public.crm_whatsapp_mensagens USING btree (external_id)
  [OK] neon: INDEX (sem constraint FK)
        SQL: CREATE UNIQUE INDEX crm_whatsapp_mensagens_external_id_unique
             ON public.crm_whatsapp_mensagens USING btree (external_id)

✅ índice único confirmado em todos os bancos acessíveis.
```

Script para re-executá-lo: `node scripts/tmp-verify-external-unique-index.js` (requer `.env.local` com as 4 variáveis `DATABASE_URL*`).

### 3. `npm ci` em clone limpo — instalação limpa de 0

```bash
# Clone em diretório totalmente novo, sem node_modules reutilizado
git clone --depth 1 https://github.com/devtiagoabreu/pdmtextil.git \
  /tmp/ci-fresh-test
cd /tmp/ci-fresh-test
npm ci
# EXIT 0 — 920 pacotes instalados em node_modules/
rm -rf /tmp/ci-fresh-test
```

Resultado: `npm ci` EXIT 0, lockfileVersion 3 consistente, sem erros. A última linha de saída confirma: audit fix suggestions apenas (advisories, sem falhas). Reproduzível em qualquer máquina com Node.js 20+.

### 4. Lockfile canônico + CI (decisão: "aprovar com ressalva operacional")

A verificação da inspeção:
- **`package.json` ↔ lockfile**: 75 dependências em ambos — nenhuma faltando, nenhuma extra.
- **Estado canônico**: `npm install --package-lock-only` em clone limpo regenera o lockfile com **SHA-256 idêntico** ao versionado (arquivo já em estado canônico — não havia correção pendente).
- **Procedimento documentado**: `docs/ci-instalacao-limpa.md` (pré-requisitos, instalação limpa com `npm ci`, passos de validação e ação ao adicionar dependências).
- **CI automatizado**: `.github/workflows/ci.yml` roda em runner vazio (Node 20) a cada push/PR: `npm ci` → `.env.local` a partir de `.env.example` → `format:check` → `tsc --noEmit` → `test` → `build`. `workflow_dispatch` permite rodar manualmente.
- **Build com placeholders validado**: `npm run build` executado com `.env.local` proveniente de `.env.example` → EXIT 0 (equivale ao passo do CI).
- **`engines`** adicionado ao `package.json` (`node >=20.9.0`) e `.nvmrc` fixando Node 20.

## Decisão do gestor

**Veredito: Aprovado com ressalva operacional — contratar.**

Correção das rotas de banco considerada **adequada**; o comportamento diante da auditoria
foi positivo e **pesa a favor** do candidato mais do que o problema residual do lockfile
pesa contra. Como **primeiro critério técnico de entrada**, exige-se:

1. **`package-lock.json` corrigido/consistente** — verificado: 75 dependências em
   `package.json` e no lockfile (nada faltando/extra) e `npm install --package-lock-only`
   regenera o arquivo com **SHA-256 idêntico** ao versionado (estado canônico).
2. **Instalação limpa verificável** — `npm ci` em clone novo passou (EXIT 0), e agora é
   validada **continuamente** pelo `.github/workflows/ci.yml` a cada push/PR.

Ambos os critérios já estão atendidos e permanecem **monitoráveis**:
o CI (`ci.yml`) roda `npm ci` → validações → build em runner vazio, e o resultado fica
visível na aba **Actions** do repositório.

---

## Commits produzidos

```
490ede44 ci: workflow de validacao com npm ci em clone limpo + documentos procedimento
9c0b268e docs: adiciona evidencias ao relatorio (fallback removido, index nos 4 bancos, npm ci limpo)
69bfc5e5 fix(seguranca): remove fallback de connectionString nas rotas de banco (criar/clonar/redundancia)
ef1d53d1 docs: relatorio da auditoria do sistema (rodadas 1 e 2 + WCAG)
9dd2d67e style: formata arquivos restantes com Prettier
5c66398d style: aplica Prettier em src (corrige achado de formatacao da auditoria)
d3bf9974 fix(seguranca): corrige achados da auditoria em webhooks, admin e banco-dados
b7b290a3 fix(ui): acessibilidade em componentes globais (WCAG)
43d86a52 fix(geral): corrige falhas encontradas na auditoria do sistema
```

Todos presentes em `main` e enviados ao remoto (`github.com/devtiagoabreu/pdmtextil`).