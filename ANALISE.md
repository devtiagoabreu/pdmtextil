# Análise de Código — PDM Têxtil

Gerada em: 28/07/2026
Escopo: Upgrade Next.js 14.2.21 → 15.5.22 + React 19.1.0 (commit `a0615d4`)

---

## 🔴 Críticos

### Segurança

| # | Problema | Local |
|---|----------|-------|
| 1 | Rotas de histórico sem autenticação | `relatorios/historico-amostra/route.ts`, `relatorios/historico-solicitacao/route.ts` |
| 2 | API pública de WhatsApp sem auth | `crm/whatsapp/conversa/route.ts` |
| 3 | GET solicitação sem auth check | `solicitacoes/[id]/route.ts` |
| 4 | GET requisição corte sem auth check | `comercial/requisicoes-corte/[id]/route.ts` |
| 5 | IDOR — qualquer usuário altera qualquer registro | `clientes/[id]/`, `crm/leads/[id]/`, `crm/pessoas/[id]/`, `cadastros/produto-cru/[id]/`, `cadastros/representantes/[id]/` |
| 6 | XSS sem sanitize no editor de email | `admin/email-massa/page.tsx:1725` |
| 7 | CORS wildcard `*` em proxy | `api/proxy-image/route.ts:72` |

### Desempenho

| # | Problema | Local |
|---|----------|-------|
| 8 | N+1 queries (INSERT em loop nos menus) | `user/menus/*` (4 arquivos) |
| 9 | 12+ endpoints sem paginação | `cadastros/*`, `admin/status`, `admin/roles`, `crm/leads` |
| 10 | `force-dynamic` + `Cache-Control` contraditórios | `dashboard/stats/route.ts` |

### Bugs

| # | Problema | Local |
|---|----------|-------|
| 11 | 63 `.catch(() => {})` — erros engolidos | Espalhado por toda a codebase |
| 12 | 14+ `addEventListener` sem cleanup (memory leak) | `header.tsx`, `email-massa/page.tsx`, `chat/page.tsx`, etc. |

---

## 🟡 Altos

### Arquitetura

- God component de 1636 linhas (`admin/email-massa/page.tsx`) + 15 outros > 300 linhas
- 69 casts `as any`, 30 `useState<any>` — anulam `strict: true` do tsconfig
- `requireAuth()` vs `getServerSession(authOptions)` inconsistente (~60 rotas usam direto)
- Apenas 2 `error.tsx` (Next.js Error Boundaries) para toda a aplicação
- `(session.user as any).role` repetido em 6+ páginas — falta estender o tipo Session

### Desempenho

- `recharts` importado em 13 client pages (~200KB cada) sem `next/dynamic`
- `.find()` em loop O(N²) em `status-utils.ts`
- `JSON.parse(JSON.stringify(...))` em vez de `structuredClone` (`state-machine.ts`)
- Upload de fotos sequencial (N+1 HTTP) (`photo-upload.tsx`)
- `requestAnimationFrame` sem `cancelAnimationFrame` (`animated-number.tsx`, `animated-line.tsx`)

### Segurança

- `.env.local` com credenciais reais no disco (db passwords, API keys, OAuth secrets)
- Várias rotas POST/PUT sem validação Zod (aceitam qualquer body)
- 30+ formulários sem proteção double-submit
- Webhook secret passado em query param (fica em logs do servidor)

### Bugs

- Fetch boilerplate repetido ~40x sem hook compartilhado
- Stale closures em `setInterval` (header, chat)

---

## 🟢 Médios

### Eficiência

- `@reduxjs/toolkit` e `@types/pg` não usados (dead weight nas dependências)
- "Carregando..." texto cru em 35+ páginas (em vez de `PageSkeleton`)
- `parseInt()` sem radix em vários `[id]` routes
- `.reverse()` muta array original em `whatsapp-chat.tsx`

### Arquitetura

- Padrão de drag handlers kanban idêntico em 8+ componentes
- Import routes repetem normalizeFieldNames 7x

### Segurança

- Nenhum rate limiting em nenhuma rota
- Open redirect: email click valida URL sem checagem (`click/[id]/route.ts`)
- SSRF: rota de teste de integração busca URLs arbitrárias
- Logs de erro retornam stack trace ao cliente (`dashboard/stats/route.ts`)

---

## Recomendações (Ordem de Prioridade)

| Prioridade | Ação |
|------------|------|
| 1 | Adicionar `requireAuth()` nas 4 rotas sem autenticação |
| 2 | Adicionar checagem de ownership nas rotas IDOR (clientes, leads, pessoas, produtos) |
| 3 | Adicionar paginação em todos os endpoints de listagem |
| 4 | Corrigir `.catch(() => {})` — no mínimo `console.error` |
| 5 | Corrigir `addEventListener` sem cleanup (return de cleanup) |
| 6 | Substituir `recharts` por `next/dynamic` nas dashboard pages |
| 7 | Adicionar Error Boundaries nas sub-rotas (comercial, admin, cadastros) |
| 8 | Substituir `useState<any>` por tipos concretos |
| 9 | Extrair fetch boilerplate em hook compartilhado |
| 10 | Adicionar Zod validation nas rotas POST/PUT sem validação |
