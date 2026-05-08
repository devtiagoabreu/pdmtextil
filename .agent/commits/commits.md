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
- fix: adiciona estado isSubmitting faltando em editar solicitacao
- fix: corrige tipo não carregando e ajusta botão cancelar em editar
- fix: carrega todos os campos do formulário em editar solicitacao
- fix: remove loop infinito no useEffect de sincronizacao

---

## BLOCO 1.5: API de solicitações + lista + formulário conectado

**Data:** 05/05/2026

### API Routes criadas:
- POST /api/solicitacoes: cria com validação de sessão
- GET /api/solicitacoes: lista filtrada por perfil
- GET /api/solicitacoes/[id]: detalhe com join
- PATCH /api/solicitacoes/[id]: adiciona comentário
- PATCH /api/solicitacoes/[id]/status: muda status com controle de perfil

### Frontend:
- nova/page.tsx: conectado à API POST real
- comercial/solicitacoes/page.tsx: lista com tabela responsiva + cards mobile

### Commit:

```
feat(bloco-1.5): API de solicitacoes + lista + formulario conectado
```

---

## BUGS EM ANDAMENTO: Campos de Input Text no Briefing não salvam

**Data:** 05/05/2026

### Problema:
- Radio buttons e checkboxes funcionam
- Inputs de texto (composição, larguraMinima/Maxima, gramaturaMinima/Maxima, prazoEntrega) NÃO são enviados no submit

### Debugging:
- Adicionados logs em BriefingTecelagemForm.tsx
- Formulário usa defaultValues: initialData mas valores alterados não aparecem no payload

### Possível solução:
- Usar setValue para inicializar os campos quando initialData muda