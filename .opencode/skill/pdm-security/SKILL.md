---
name: pdm-security
description: Segurança para o PDM Pro Têxtil (Next.js 15 App Router). Use ao criar/alterar autenticação, autorização, rotas de API, uploads, integrações externas, webhooks, IA/LLM, sanitização de HTML ou ao auditar o código. Cobre XSS, CSRF, SSRF, injeção, segredos, headers e dependências.
---

# PDM Pro Têxtil — Skill de Segurança

Base: skill de referência `security-and-hardening` (OWASP Top 10 + Top 10 LLM) adaptada às convenções reais do repositório. Combine sempre com a skill `pdm-dev` (convenções gerais do projeto).

## 1. Princípio Geral

Trate **todo input externo como hostil**, todo segredo como sagrado e toda checagem de autorização como obrigatória. Autorize **perto dos dados** (route handler / Server Action que toca o dado), nunca apenas no `middleware.ts` (que roda na borda e já teve bypass conhecido no Next — CVE-2025-29927).

## 2. Estado Atual do Projeto (fatos)

- Next.js `^15.5.22` (>= `15.5.18` exigido pelo release de segurança de maio/2026). **Não permita downgrade.**
- Auth: NextAuth v4, estratégia **JWT**, cookie de sessão `httpOnly` + `sameSite=lax` (padrão NextAuth) — baseline de CSRF ok. Senhas com **bcryptjs** (`src/lib/auth.ts`).
- Segredos: `.env*` está no `.gitignore`; 4 bancos via `DATABASE_URL*`. Nunca commitar `.env.local` nem prefixar segredo com `NEXT_PUBLIC_`.
- Erros: `src/lib/api-error.ts` — `handleApiError` devolve **mensagem genérica** ao cliente (sem stack), loga e notifica a equipe via `notificarErro`. FK devolve 409 com `fkError: true`. Continue usando SEMPRE nos route handlers.
- Validação: `src/lib/validation.ts` (zod) + `validateRequest` na borda de toda API. Obrigatório.
- Sanitização: `src/lib/sanitize.ts` (DOMPurify allowlist). **Atenção — gap conhecido:** `sanitizeHtml` só sanitiza no cliente (`typeof window === "undefined"` retorna raw). HTML vindo de rich text deve ser **sanitizado ao gravar no servidor**, não só na exibição.
- Integrações externas: Google Drive/Calendar (`google-drive.ts`, `google-calendar.ts`), `@vercel/blob` (uploads/`anexos`), WhatsApp (`evolution-api`), email (nodemailer), planilhas BI (Google Sheets), IA/LLM (Groq/OpenAI/Claude/Gemini/DeepSeek via `ai-chaves`).
- Rotas sensíveis a SSRF: `src/app/api/proxy-image/` (proxy de imagem) e qualquer fetch com URL influenciada pelo usuário.
- `next.config.js`: `remotePatterns` já pinado para `vercel-blob.com` (bom). **Não** há headers de segurança configurados ainda.

## 3. Sempre Fazer (obrigatório)

- **Validar todo input na borda**: `validateRequest(schema, body)` com zod em TODA rota de API/Server Action (nunca confiar em validação do cliente).
- **Autenticar**: `getServerSession(authOptions)` → 401 se ausente; ou `requireAuth()` para operações por usuário/dono (`src/lib/auth.ts`).
- **Autorizar por recurso**: mesmo com sessão válida, verificar se o usuário tem permissão/é dono do registro (ex. `validate-ownership.ts`, roles em `roles.ts`/`user-menus.ts`). O botão só ser renderizado para admin **não** impede chamada direta à API.
- **Usar `handleApiError`** em todos os `catch` (nunca devolver stack trace/mensagem interna).
- **Parametrizar queries**: Drizzle (`db.select().from(...).where(eq(...))`) já parametriza. Nunca concatenar input em SQL cru.
- **Encodar saída**: usar a auto-escaping do React. Se usar `dangerouslySetInnerHTML`/`react-markdown`, sanitizar o conteúdo no servidor antes de salvar (ver gap em §2).
- **Senhas**: `bcrypt.compare` (já no fluxo de login). Ao criar campo de senha novo, use bcryptjs com salt rounds ≥ 10.
- **Cookies/sessão**: manter padrão NextAuth (httpOnly). Não guardar tokens de autenticação em `localStorage` — use cookies httpOnly.
- **Não expor segredos** em props de Server Component nem em variáveis `NEXT_PUBLIC_`.
- **Não logar dados sensíveis** (senha, token, dados pessoais completos). `log.ts`/`notificar.ts` para eventos.
- **Sanitizar HTML no servidor** ao gravar rich text/descrições (estender `sanitizeHtml` para rodar no servidor, ex. com `isomorphic-dompurify` ou sanitizando no endpoint antes do `db.insert`).
- **SSRF**: qualquer `fetch` cujo URL seja influenciado por input (proxy de imagem, importação, webhook) deve validar protocolo `https:`, host em allowlist e **rejeitar IPs privados/loopback** (`169.254.169.254`, `localhost`, `127.0.0.1`, ranges privados).

## 4. Perguntar/Alertar o Usuário Antes (mudanças sensíveis)

- Alterar fluxo de autenticação (provedores, JWT→sessão, expiração).
- Adicionar integração externa nova (domínio, escopo OAuth, webhook).
- Mudar política CORS ou `remotePatterns` do `next/image`.
- Adicionar handler de upload de arquivo novo.
- Adicionar rate limiting em endpoints de auth.
- Elevar permissões/roles padrão.

## 5. Nunca Fazer

- Commitar segredos ou chaves (rotacionar imediatamente se acontecer — assume comprometido).
- `eval()`, `innerHTML` com input do usuário, `dangerouslySetInnerHTML` sem sanitização no servidor.
- Desabilitar headers de segurança "por conveniência".
- `npm audit fix --force` ou `audit fix` cego (revisar changelog e testar cada upgrade).
- Expor stack trace ou detalhes internos em respostas.
- Aceitar URL de `fetch` do usuário sem allowlist (SSRF).
- Colocar segredos, dados de outros usuários ou o system prompt inteiro no contexto de LLM.

## 6. IA / LLM (chat, assistente, `ai-chaves`, WhatsApp AI)

O projeto tem features de IA — aplicam-se as regras OWASP Top 10 para LLM:

- **Saída de LLM = input não confiável**. Nunca passe resposta do modelo para `eval`, SQL, shell, `innerHTML` ou caminho de arquivo. Parseie de forma defensiva (ex. `JSON.parse` + zod) e revalide.
- **Prompt injection**: texto de usuário/PDF/página no contexto pode carregar instruções. Autorização/permissões são aplicadas **em código**, nunca via instrução no system prompt.
- **Dados fora do prompt**: não colocar chaves de API, dados de outros tenants nem o prompt completo onde o modelo possa ecoar.
- **Consumo**: limitar tokens/tamanho de resposta para evitar custo/loop (LLM10).

## 7. Checklists Rápidos

### Rota de API nova
- [ ] `getServerSession`/`requireAuth` + checagem de autorização por recurso
- [ ] `validateRequest(schema, body)` na borda
- [ ] `handleApiError` no catch (mensagem genérica)
- [ ] Sem segredos nos retornos; campo `password`/token nunca incluído
- [ ] `dynamic = "force-dynamic"` (padrão do projeto)

### Upload/arquivo
- [ ] Restringir tipos (`image/jpeg`, `image/png`, `image/webp`, PDF) e tamanho máximo
- [ ] Não confiar no `filename`/extensão como segurança; validar `mimetype`/magic bytes
- [ ] Armazenar em `@vercel/blob`/anexos seguindo padrão existente

### Segredos
- [ ] Só via `process.env`; sem `NEXT_PUBLIC_` para segredos
- [ ] `.env*` no `.gitignore`; nunca commit
- [ ] `git diff --cached` sem `password|secret|api_key|token`

### Dependências
- [ ] `npm audit` sem achado crítico/alto alcançável (via `cmd /c`)
- [ ] Novo pacote revisado (ownership, manutenção, typosquat)

### Features de IA
- [ ] Saída validada/encodada; sem passagem para SQL/DOM/shell
- [ ] Sem segredos/PII de outros usuários no contexto
- [ ] Consumo limitado

## 8. Hardening Recomendado (ainda não aplicado no repo)

Ao tratar de headers de segurança, proponha adicionar em `next.config.js` (com aprovação do usuário):
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (ou `frame-ancestors 'none'` via CSP), `Permissions-Policy`, e `Strict-Transport-Security` em produção. CSP completo com nonces é complexo com o `next/script`/inline do React — se for adotar, comece em modo `report` (apenas reportar) antes de bloquear.

Também considerar rate limiting nos endpoints de login (`/api/auth/[...nextauth]`) e nos webhooks do WhatsApp, seguindo o padrão que já existir no projeto (não inventar infra nova sem conversar com o usuário).
