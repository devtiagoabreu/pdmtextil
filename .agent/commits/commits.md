# Commits Consolidado

---

## BLOCO 1.2: Banco de Dados e Schemas (MVP)

**Objetivo:** Criação das tabelas base (usuários, sessões, solicitações, anexos), geração de migrações e seed do banco de dados com usuários iniciais.
**Tempo estimado:** 30 minutos

### Arquivos criados/modificados:

- `src/lib/db/schema/usuarios.ts` - Schema da tabela de usuários e sessões do sistema.
- `src/lib/db/schema/solicitacoes.ts` - Schema central do MVP para as solicitações do Comercial.
- `src/lib/db/schema/anexos.ts` - Schema para gerenciar os arquivos das solicitações.
- `src/lib/db/schema/index.ts` - Arquivo de exportação dos schemas.
- `src/lib/db/seed.ts` - Script para popular os usuários de teste.
- `src/lib/db/migrations/*` - Arquivos de migração gerados automaticamente pelo Drizzle Kit.

### Instruções para o usuário:

Você pode verificar se as tabelas foram criadas com sucesso usando o painel do Neon DB.
O banco já possui os seguintes usuários configurados (senha para todos é 123456):

- comercial@promoda.com (COMERCIAL)
- tecelagem@promoda.com (TECELAGEM)
- beneficiamento@promoda.com (BENEFICIAMENTO)
- admin@promoda.com (ADMIN)

### Dependências:

Nenhuma nova dependência adicionada neste bloco.

### Pontos de atenção:

Ajustei o arquivo drizzle.config.ts criado no Bloco 1.1 para utilizar o parâmetro `dialect: "postgresql"`, alinhado com a versão v0.31+ do Drizzle Kit atual.
As migrações já foram aplicadas no banco de dados e o script de seed já foi executado. O ambiente está 100% pronto para conectarmos as telas e lógica.

### Commit pronto:

```
feat: implementação dos schemas de bd para o mvp e configuração do drizzle orm
```

---

## BLOCO 1.3: Autenticação NextAuth e Layout Base

**Objetivo:** Inicializar componentes de interface essenciais via shadcn/ui e construir o provedor e a tela de login do NextAuth.
**Tempo estimado:** 30 minutos

### Arquivos criados/modificados:

- `src/components/ui/*` - Arquivos dos componentes UI instalados (button, input, label, card, tabs, select, dropdown-menu, popover, dialog, sonner).
- `src/components/providers.tsx` - Componente Provider para injetar a sessão do NextAuth em toda a aplicação.
- `src/app/login/page.tsx` - Nova tela de login seguindo o layout do projeto, conectada à função signIn do NextAuth (Credentials).
- `src/app/layout.tsx` - RootLayout modificado para envolver os children com o `<Providers>` e também com o `<Toaster>` (do Sonner, para notificações).
- `components.json` - Configurações geradas pela inicialização da CLI do shadcn.

### Instruções para o usuário:

A tela de login base agora está acessível. Se você estiver rodando o servidor (npm run dev), você pode tentar fazer login com comercial@promoda.com e a senha 123456.
O componente de notificação mudou de toast para sonner na versão mais recente do shadcn/ui.

### Dependências:

Componentes shadcn foram injetados no código fonte (não são libs via npm, mas sim código em src/components/ui).

### Pontos de atenção:

O componente genérico form do shadcn não apareceu na lista final instalada. Eu criei a página de login usando um `<form>` nativo em conjunto com `<Input>` e `<Label>`, que atende perfeitamente à demanda.

### Commit pronto:

```
feat: setup do layout base, provedores de sessão e tela de login NextAuth
```

---

## CORREÇÃO 1: Tailwind CSS v3 Compatibility

O log mostrou: `Syntax error: /vercel/path0/src/app/globals.css The outline-ring/50 class does not exist.`

Isso ocorreu porque a versão mais recente da CLI do shadcn/ui (v4.6.0) injetou uma classe chamada `outline-ring/50` no reset global do arquivo globals.css. Essa classe foi projetada para a nova versão do Tailwind CSS v4, mas nosso projeto utiliza a versão v3.4.1.

### Correção aplicada:

- Removida a instrução conflituosa `outline-ring/50` do arquivo `src/app/globals.css`
- Adicionadas variáveis de cor pendentes (como ring e input) no `tailwind.config.ts`

### Commit:

```
fix: correção de compatibilidade CSS para Tailwind v3 no Vercel
```

---

## CORREÇÃO 2: Custom Types NextAuth

O Vercel acusou: `Type error: Property 'role' does not exist on type 'User | AdapterUser'.`

O TypeScript barrou porque o pacote next-auth possui tipagem padrão sem o campo `role`.

### Correção aplicada:

- Criado `src/types/next-auth.d.ts` estendendo os tipos do NextAuth
- Adicionado `as any` no adapter em `src/lib/auth.ts`

### Commit:

```
fix: corrige tipagem customizada do next-auth adicionando a propriedade role
```

---

## CORREÇÃO 3: Redirect to Login

O Vercel exibia a página padrão do Next.js na raiz porque o login estava em `/login`.

### Correção aplicada:

- Sobrescrito `src/app/page.tsx` com redirecionamento automático para `/login`

### Commit:

```
feat: redireciona raiz para tela de login
```

---

## BLOCO 1.4: Layout do Dashboard + Tela de Nova Solicitação

**Data:** 02/05/2026

### O que foi feito:

**CORREÇÕES DE BUILD (Windows + Node v22):**
- postcss.config.mjs → postcss.config.cjs (CommonJS)
- next.config.mjs → next.config.js (CommonJS)
- tailwind.config.ts → tailwind.config.js (CommonJS)
- zod@4 → zod@3 (compatibilidade)
- Removidas importações incompatíveis
- globals.css convertido de OKLCH para HSL

**LAYOUT:**
- globals.css — Inter via Google Fonts, animações, dark mode
- providers.tsx — ThemeProvider + SessionProvider
- theme-toggle.tsx — Toggle light/dark/system
- header.tsx — Busca, notificações, menu usuário
- sidebar.tsx — Responsiva: desktop/mobile
- mobile-bottom-nav.tsx — Navegação inferior mobile
- (dashboard)/layout.tsx — Client component com sidebar
- (dashboard)/page.tsx — Dashboard com cards

**NOVA SOLICITAÇÃO:**
- types/briefing.ts — Schemas Zod (8 seções)
- BriefingTecelagemForm.tsx — Formulário completo
- AnexosUpload.tsx — Drag & Drop + links externos
- comercial/solicitacoes/nova/page.tsx — Wizard 3 passos

**Dependências:** zod@3, @hookform/resolvers@3, shadcn (radio-group, checkbox, textarea, separator)

### Commit:

```
feat(bloco-1.4): layout do dashboard + wizard de nova solicitacao
```

---

## CORREÇÃO: ENOENT page_client-reference-manifest na Vercel

**Causa raiz:** Conflito entre (dashboard)/page.tsx e app/page.tsx competindo pela URL "/".

**Correção aplicada:**
- Movido (dashboard)/page.tsx → (dashboard)/dashboard/page.tsx
- Removido (dashboard)/page.tsx conflitante
- Atualizado middleware.ts com "/dashboard" no matcher

### Commit:

```
fix(bloco-1.4): resolve conflito de rotas que causava ENOENT na Vercel
```

---

## BUGS FIX: Payload POST/PUT com dados nulos

**Data:** 04/05/2026

### Problema:
Com técnica CSS hidden/block, o form do Passo 1 nunca era disparado ao ir direto para o Passo 3.

### Correção:
Extraído `getValues()` do RHF e usado diretamente no payload.

### Commit:

```
fix: corrige payload nulo no POST/PUT lendo valores diretamente do react-hook-form
```

---

## BUGS FIX: CNPJ manual e Resumo desatualizado

**Data:** 04/05/2026

### Correções:
- CNPJ manual não chegava ao RHF — adicionado `setValue("cnpj", val)` no onCnpjChange
- Resumo do Passo 3 mostrava dados antigos — corrigido usando `watch()` do RHF

### Commit:

```
fix: sincroniza cnpj manual ao rhf e corrige resumo do passo 3 com dados em tempo real
```

---

## BUGS FIX: Campo de data não salva no banco

**Data:** 04/05/2026

### Problema:
Drizzle não converte strings automaticamente para timestamp do Postgres.

### Correções:
- useEffect com watch() sincroniza comercialData em tempo real
- API PUT agora usa mapeamento explícito com new Date()

### Commit:

```
fix: sincroniza comercialData com RHF em tempo real para evitar perda de dados no payload
```

---

## BUGS FIX: Campos não carregando e loop infinito

**Data:** 05/05/2026

### Correções:
- Adicionado estado `isSubmitting` faltando em editar
- Select Tipo não carregando — adicionado setValue
- Campos comerciais não carregando — adicionado setValue para todos
- Loop infinito no useEffect — removido
- Botão Cancelar — redireciona para lista

### Commits:
- `b88689e` fix: add quantidadeProduzida to Amostra types in produto-cru page
- `b269989` feat: add integracoes module (schema, API, CRUD page, config hub card)
- `0d4a407` feat: add test endpoint for integracoes (frontend button + API proxy)
- `abc43be` fix: send OAuth2 client credentials via Basic Auth header
- `3c2fc6d` feat: add field mapping, screen config, and API import modal for clientes
- `253603a` fix: add ativo to Integracao interface, remove useCallback warning
- `c1691dc` feat: visual field mapping editor for integracoes
- `aa4cf6f` fix: translate uniqueKey from API field to PDM field in import dedup check
- `25f807c` feat: add search filter in import API modal grid

---

### Empresa Config, Exportar Dados, Import via API Genérico, Proxy Imagem

**Data:** 28-30/05/2026

Módulo de Exportar Dados com botão em todas as listas, Configurações de Empresa (CNPJ, endereço, logo), Importação via API genérica reutilizável, Proxy de imagem seguro.

**Commits:**
- `6a6d61b` feat: add empresa config, exportar dados, import via API generico, proxy imagem
- `4e4900b` fix: jspdf dep, next.config.js for Next.js 14, syntax errors
- `1a819c2` fix: comercial/clientes missing return closing paren
- `c644b8b` fix: implicit any type in integracao import route
- `14daa98` fix: implicit any type on v param in integracao import
- `a2a68d4` fix: implicit any on filter callback, use as string[] cast
- `96aa0ca` fix: replace sql.raw() with parameterized queries to prevent SQL injection
- `938e559` fix: type mapped explicitly to fix cascade implicit any errors
- `d8d32b3` feat: add auth and SSRF validation to proxy-image endpoint (#2)
- `7b4cc90` feat: add auth to clientes GET and POST routes (#3)
- `c0b8bbf` perf: fix N+1 query in produto cru detail route (#7)
- `22c76e3` fix: type error in N+1 fix for produto cru route
- `3af65b2` perf: optimize ownership validation with requireAuth() helper (#8)
- `6fcb526` fix: update DELETE handler to use requireAuth instead of getServerSession
- `8b641cd` fix: add missing getServerSession import to auth.ts
- `3a900d1` perf: consolidate dashboard stats queries (#9)
- `9682d6f` feat: wrap critical multi-step operations in DB transactions (#11)
- `0f91f68` feat: add standardized Zod validation with validateRequest helper (#17)
- `15b595a` fix: use raw body for fios insert to avoid drizzle type mismatch
- `e651de3` fix: make linkSchema descricao required, use body for produto-cru insert

---

### Refactoring Briefing + Info-Content + Test Suite

**Data:** 30/05 - 01/06/2026

- BriefingTecelagemForm extraído em componentes de seção (1096 → 124 linhas)
- Info-content refatorado em módulos de domínio (383 → 6 arquivos)
- Test suite: Vitest 4.1.7 + jsdom, 42 testes de validação Zod, 38 testes de componentes
- Component tests: ConfirmModal, LinksEditor, Button

**Commits:**
- `6e2c96b` refactor: extract section components from BriefingTecelagemForm (1096->124 lines)
- `682bc4c` refactor: split info-content into domain modules (383->6 files)
- `a2ec1f2` chore: remove old info-content.ts (replaced by domain modules)
- `32bae00` fix: add local import for InfoContent type in index.ts
- `ad29e3c` feat: add test suite with Vitest and 42 validation tests
- `2b8f4db` feat: add component tests with React Testing Library

---

### Solicitações Detail/List Improvements + AGUARDANDO_MATERIA_PRIMA

**Data:** 01/06/2026

- "Dados do Produto" sub-section no Briefing Técnico da solicitacao detail
- "Observações" column na lista de solicitações
- Extração de observações do briefing JSONB com COALESCE
- Novo status AGUARDANDO_MATERIA_PRIMA added to STATUS_CONFIG, STATUS_TRANSICOES, STATUS_VALIDOS
- Produto Vinculado indicator (removido filtro APROVADO)

**Commits:**
- `4528b3c` feat: add Dados do Produto to detail view and Observações column to list
- `0beb9c8` fix: escape quotes in chat page text
- `885daff` fix: produto vinculado, observacoes, status AGUARDANDO_MATERIA_PRIMA

---

### Chat Corporativo (Módulo Completo)

**Data:** 01/06/2026

Sistema de chat interno completo:
- DB schema: `chats`, `chat_mensagens`, `chat_participantes`, `chat_leituras`
- API routes: list/create/detail/delete, send/get messages, mark-as-read, entity lookup, unread count
- Global ChatButton in header with unread counter (30s polling)
- `/chat` split-view page (sidebar + conversation)
- Auto-read marking, Enter to send, polling every 3s
- GET mensagens joins usuarios for remetenteNome
- Emoji picker (80 emojis, 16-column grid)
- EntityChatButton reusable component
- Custom dropdown (replaces native select for dark mode)

**Commits:**
- `f987c24` feat: add Chat Corporativo module
- `75ff184` fix: join usuarios in GET mensagens to include remetenteNome
- `2bd0fc6` fix: send JSON body in marcarLidas and render participantes count
- `8b93ed0` feat: add emoji picker to chat
- `03d6f8f` fix: increase emoji grid to 12 columns
- `62271d2` fix: 16-column emoji grid with arbitrary value
- `4aa843b` fix: widen emoji popover to min-w-[460px]
- `b0d7561` fix: chat bugs — leituras inArray, empty messages, unhandled rejection, redundant dynamic imports
- `6041a40` fix: replace native select with custom dropdown in NovoChatDialog
- `f9342dd` perf: reduce chat polling to 3s and remove await on mark-read
- `9d31eff` fix: remove chatExists from solicitacoes list API (table not migrated)
- `d6c4f66` fix: add chat tables to migration and restore chatExists in API

---

### Ferramentas (Regra de Três, Conversores Têxteis)

**Data:** 01/06/2026

Ferramentas auxiliares no sistema:
- Regra de Três Composta com calculadora e "Preencher com Exemplo"
- Conversores Têxteis (Ne, Nm, Tex, Dtex, Denier)
- Nav reorganized with Ferramentas, Configurações, Relatórios hubs

**Commits:**
- `61e8df9` feat: reorganize nav - Configurações and Relatórios hubs
- `e8dd9df` feat: add Ferramentas nav with Regra de Três calculator
- `bc172bd` feat: add 'Preencher com exemplo' button in regra de tres info modal
- `62db71e` fix: regra de tres composta calculation and form
- `8dfbe4a` fix: reduce input field sizes in regra de tres composta
- `4fbe29a` feat: add Conversores Texteis (Tex, Ne, Denier) tool
- `f4deb0d` feat: expand yarn count converter - Ne, Nm, Tex, Dtex, Denier

---

### Dashboard Global Totals + Clickable Legends + Gráficos

**Data:** 01/06/2026

- Dashboard cards agora mostram totais globais (não só mês atual), label "Total"
- Comparação mensal usa YYYY-MM (não locale-dependent)
- Pie chart substituído por legend buttons clicáveis (filtro por status)
- Solicitacoes-lista API sem filtro de data (todos os registros)

**Commits:**
- `971de13` feat: make status distribution card and activity rows clickable
- `aa5b605` fix: make each pie slice clickable by status
- `a1fa23c` fix: move onClick to Cell component in PieChart
- `134c8bb` fix: use Pie onClick instead of Cell for status filter
- `22547f5` fix: Pie onClick with index lookup, no Cell children
- `2b72a1b` fix: replace pie onClick with clickable legend buttons
- `50ac1fb` fix: compare month via YYYY-MM instead of locale string
- `a6cb36f` feat: dashboard shows global totals instead of current month only
- `049eec5` fix: rename card label to 'Total'

---

### ERP Field (idIntegracaoErpCru) em Amostras de Produto Cru

**Data:** 01/06/2026

- Schema: campo `idIntegracaoErpCru` em `produto_cru_amostra`
- Migration: ALTER TABLE adicionando coluna
- API: POST e PUT aceitam o campo
- UI: display + formulário na página de produto-cru

**Commits:**
- `f29c7b2` feat: add ERP field (id_integracao_erp_cru) to tecido cru samples

---

### EntityChatButton + Chat Indicator em Produto Cru List

**Data:** 01/06/2026

- Componente reutilizável `EntityChatButton` para qualquer entidade
- Substitui chat inline handler na solicitação detail
- Adicionado EntityChatButton na página produto-cru detail
- ChatExists indicator (MessageSquare icon) na lista de produto-cru
- Fixed row click on clientes list redirecting to correct route

**Commits:**
- `a7af404` feat: replace inline chat button with reusable EntityChatButton; add chat indicator to produto-cru list
- `b2f1934` fix: redirect row click on clientes list to /comercial/clientes/{id} instead of non-existent /cadastros/clientes/{id}