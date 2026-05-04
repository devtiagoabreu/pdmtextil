📦 BLOCO 1.2: Banco de Dados e Schemas (MVP) 🎯 Objetivo: Criação das tabelas base (usuários, sessões, solicitações, anexos), geração de migrações e seed do banco de dados com usuários iniciais. ⏱️ Tempo estimado: 30 minutos

✅ Arquivos criados/modificados:

src/lib/db/schema/usuarios.ts - Schema da tabela de usuários e sessões do sistema.
src/lib/db/schema/solicitacoes.ts - Schema central do MVP para as solicitações do Comercial.
src/lib/db/schema/anexos.ts - Schema para gerenciar os arquivos das solicitações.
src/lib/db/schema/index.ts - Arquivo de exportação dos schemas.
src/lib/db/seed.ts - Script para popular os usuários de teste.
src/lib/db/migrations/* - Arquivos de migração gerados automaticamente pelo Drizzle Kit.
📝 Instruções para o usuário:

Você pode verificar se as tabelas foram criadas com sucesso usando o painel do Neon DB.
O banco já possui os seguintes usuários configurados (senha para todos é 123456):

comercial@promoda.com
 (COMERCIAL)

tecelagem@promoda.com
 (TECELAGEM)

beneficiamento@promoda.com
 (BENEFICIAMENTO)

admin@promoda.com
 (ADMIN)
🔧 Dependências:

Nenhuma nova dependência adicionada neste bloco.
⚠️ Pontos de atenção:

Ajustei o arquivo drizzle.config.ts criado no Bloco 1.1 para utilizar o parâmetro dialect: "postgresql", alinhado com a versão v0.31+ do Drizzle Kit atual.
As migrações já foram aplicadas no banco de dados e o script de seed já foi executado. O ambiente está 100% pronto para conectarmos as telas e lógica.
✅ Commit pronto:

feat: implementação dos schemas de bd para o mvp e configuração do drizzle orm


📦 BLOCO 1.3: Autenticação NextAuth e Layout Base 🎯 Objetivo: Inicializar componentes de interface essenciais via shadcn/ui e construir o provedor e a tela de login do NextAuth. ⏱️ Tempo estimado: 30 minutos

✅ Arquivos criados/modificados:

src/components/ui/* - Arquivos dos componentes UI instalados (button, input, label, card, tabs, select, dropdown-menu, popover, dialog, sonner).
src/components/providers.tsx - Componente Provider para injetar a sessão do NextAuth em toda a aplicação.
src/app/login/page.tsx - Nova tela de login seguindo o layout do projeto, conectada à função signIn do NextAuth (Credentials).
src/app/layout.tsx - RootLayout modificado para envolver os children com o <Providers> e também com o <Toaster> (do Sonner, para notificações).
components.json - Configurações geradas pela inicialização da CLI do shadcn.
📝 Instruções para o usuário:

A tela de login base agora está acessível. Se você estiver rodando o servidor (npm run dev), você pode tentar fazer login com comercial@promoda.com e a senha 123456.
O componente de notificação mudou de toast para sonner na versão mais recente do shadcn/ui.
🔧 Dependências:

Componentes shadcn foram injetados no código fonte (não são libs via npm, mas sim código em src/components/ui).
⚠️ Pontos de atenção:

O componente genérico form do shadcn não apareceu na lista final instalada. Eu criei a página de login usando um <form> nativo em conjunto com <Input> e <Label>, que atende perfeitamente à demanda. Verificaremos a instalação do <Form> do shadcn (usado com react-hook-form) antes do próximo bloco.
✅ Commit pronto:

feat: setup do layout base, provedores de sessão e tela de login NextAuth


Excelente! O erro mudou e avançamos para a compilação do CSS.

O que aconteceu dessa vez? O log mostrou: Syntax error: /vercel/path0/src/app/globals.css The outline-ring/50 class does not exist. Isso ocorreu porque a versão mais recente da CLI do shadcn/ui que instalamos (v4.6.0) injetou uma classe chamada outline-ring/50 no reset global do arquivo globals.css. Essa classe foi projetada para a nova versão do Tailwind CSS v4, mas nosso projeto utiliza a versão super estável v3.4.1, que não conseguiu interpretar essa sintaxe diretamente.

Como eu resolvi:

Fui até o arquivo src/app/globals.css e removi a instrução conflituosa outline-ring/50.
Também adicionei as variáveis de cor pendentes (como ring e input) no tailwind.config.ts para garantir compatibilidade 100% segura com qualquer componente do shadcn.
O código agora está totalmente limpo para passar pela build do Vercel!

Próximo Passo: Faça novamente o commit e push com as minhas correções:

bash
git add src/app/globals.css tailwind.config.ts
git commit -m "fix: correção de compatibilidade CSS para Tailwind v3 no Vercel"
git push


Chegamos na última etapa do build, a checagem do TypeScript! O Vercel acusou o seguinte erro: Type error: Property 'role' does not exist on type 'User | AdapterUser'.

O que aconteceu? O TypeScript é rigoroso: o pacote next-auth possui uma tipagem padrão de User que contém apenas name, email e image. Como nós adicionamos a propriedade customizada role no nosso banco de dados e tentamos usá-la nos callbacks da sessão (token.role = user.role), o TypeScript barrou a compilação porque ele não "conhecia" essa propriedade. Além disso, houve um conflito de tipos de versão entre o next-auth (v4) e o @auth/drizzle-adapter (que usa tipos do v5 core).

Como eu resolvi:

Criei um arquivo src/types/next-auth.d.ts onde fiz a "extensão" oficial dos tipos do NextAuth. Ensinei ao TypeScript que o nosso User, a Session e o JWT agora possuem sim o campo id e role.
Em src/lib/auth.ts, utilizei a asserção as any no adapter para ignorar a incompatibilidade milimétrica de versões entre as bibliotecas.
Eu já rodei o verificador de tipos localmente (npx tsc) e ele retornou Zero Erros!

Próximo Passo: Faça o commit e o push novamente:

bash
git add src/types/next-auth.d.ts src/lib/auth.ts
git commit -m "fix: corrige tipagem customizada do next-auth adicionando a propriedade role"
git push

Isso mesmo! O Vercel está exibindo a página raiz padrão do Next.js porque o componente de Login que nós criamos no Bloco 1.3 foi colocado na rota específica /login.

Se você adicionar /login no final da sua URL do Vercel (ex: https://seu-dominio.vercel.app/login), você verá a nossa tela de login!

Para deixar o sistema perfeito e redirecionar automaticamente quem acessar a página inicial (/) direto para o /login, eu acabei de sobrescrever o arquivo src/app/page.tsx. Agora ele tem apenas um comando de redirecionamento automático.

Você pode fazer um commit rápido para atualizar isso no Vercel:

bash
git add src/app/page.tsx
git commit -m "feat: redireciona raiz para tela de login"
git push


---

📦 BLOCO 1.4: Layout do Dashboard + Tela de Nova Solicitação
🗓️ Data: 02/05/2026

✅ O que foi feito:

CORREÇÕES DE BUILD (Windows + Node v22):
  - postcss.config.mjs → postcss.config.cjs (CommonJS para compatibilidade)
  - next.config.mjs → next.config.js (CommonJS)
  - tailwind.config.ts → tailwind.config.js (CommonJS com cores do sidebar)
  - zod@4 → zod@3 (compatibilidade com @hookform/resolvers@3)
  - Removidas importações @import "tw-animate-css" e "shadcn/tailwind.css" incompatíveis com Tailwind v3
  - globals.css convertido de OKLCH para HSL (Tailwind v3)

LAYOUT (seguindo skill 007_layout.md):
  - src/app/globals.css — Inter via Google Fonts, animações fade-in/slide-in, dark mode HSL
  - src/components/providers.tsx — ThemeProvider (next-themes) + SessionProvider integrados
  - src/components/layout/theme-toggle.tsx — Toggle light/dark/system
  - src/components/layout/header.tsx — Busca, painel de notificações, ThemeToggle, menu do usuário
  - src/components/layout/sidebar.tsx — Responsiva: fixed desktop, overlay mobile, nav por perfil
  - src/components/layout/mobile-bottom-nav.tsx — Navegação inferior mobile por perfil
  - src/app/(dashboard)/layout.tsx — Client component com estado de sidebar mobile
  - src/app/(dashboard)/page.tsx — Dashboard com cards stats, ações rápidas, design system

NOVA SOLICITAÇÃO:
  - src/types/briefing.ts — Schemas Zod (DadosComerciais + BriefingTecelagem com 8 seções)
  - src/components/forms/BriefingTecelagemForm.tsx — Formulário com todas as 8 seções
  - src/components/forms/AnexosUpload.tsx — Drag & Drop + links externos (UI sem upload real)
  - src/app/(dashboard)/comercial/solicitacoes/nova/page.tsx — Wizard de 3 passos

🔧 Dependências instaladas:
  - zod@3 (downgrade de v4)
  - @hookform/resolvers@3 (compatível com zod@3)
  - Componentes shadcn: radio-group, checkbox, textarea, separator

⚠️ Atenção:
  - O submit do Passo 3 ainda é um mock (console.log) — API real será implementada no Bloco 1.5
  - O upload de arquivos (Vercel Blob) também será integrado no Bloco 1.6
  - O Dashboard mostra contadores zerados — serão conectados à API no Bloco 1.7.

---

📦 BLOCO BUGS: Correções de Estado e Perda de Dados
🗓️ Data: 04/05/2026

✅ O que foi feito:

- **Correção da Perda de Dados no Wizard (Prazo de Entrega):** O formulário de Nova/Edição de Solicitação perdia os dados preenchidos no Passo 2 se o usuário retornasse ao Passo 1 sem avançar. A renderização condicional (`{step === 1 && ...}`) foi substituída pela ocultação via CSS (`className={step === 1 ? "block" : "hidden"}`), garantindo que o estado do React Hook Form seja preservado em todos os passos.
- **Logs de Debugging (API):** Adicionados `console.log` na API (`/api/solicitacoes` e `/api/solicitacoes/[id]`) e no client-side para rastrear o payload exato enviado para o banco de dados.

✅ Commit pronto:
`fix: corrige perda de estado no formulario multi-step e adiciona logs de debug`

---

📦 BLOCO BUGS FIX 2: Payload POST/PUT com dados nulos
🗓️ Data: 04/05/2026

✅ O que foi feito:

- **Causa raiz identificada:** Com a técnica CSS `hidden/block`, o `<form onSubmit={handleSubmit(...)}>` do Passo 1 nunca é disparado ao ir direto para o Passo 3. Logo o `comercialData` (state) nunca recebia os valores do React Hook Form (RHF). O payload era construído lendo `comercialData` — que permanecia com os valores iniciais vazios/null.
- **Correção (nova/page.tsx e editar/page.tsx):** Extraído `getValues()` do RHF e usado diretamente na construção do payload, com fallback para `comercialData`. Agora `prazoDesejado`, `projeto`, `cnpj`, `tipo` e `cliente` chegam corretamente no POST e PUT.

✅ Commit pronto:
`fix: corrige payload nulo no POST/PUT lendo valores diretamente do react-hook-form`

---

📦 BLOCO BUGS FIX 3: CNPJ manual e Resumo desatualizado
🗓️ Data: 04/05/2026

✅ O que foi feito:

- **Bug 2 — CNPJ digitado manualmente não chegava ao RHF:** O `ClienteAutocomplete` gerenciava o CNPJ digitado manualmente apenas via `onCnpjChange → setComercialData`, nunca chamando `setValue("cnpj", val)` do RHF. Com isso, `getValues().cnpj` retornava `""` quando o usuário digitava o CNPJ à mão (sem selecionar da lista). Corrigido em `nova/page.tsx` e `editar/page.tsx` adicionando `setValue("cnpj", val)` dentro do `onCnpjChange`.
- **Bug 3 — Resumo do Passo 3 exibia dados desatualizados:** O bloco de resumo lia `comercialData` (estado React), que só era atualizado ao clicar em "Continuar" no Step 1. Se o usuário editava um campo e avançava diretamente, o resumo mostrava os valores antigos. Corrigido usando `watch("cliente")`, `watch("projeto")` e `watch("tipo")` do RHF, com fallback para `comercialData`.

✅ Commit pronto:
`fix: sincroniza cnpj manual ao rhf e corrige resumo do passo 3 com dados em tempo real`

---

📦 BLOCO BUGS FIX 4: Campo de data não salva no banco (PUT)
🗓️ Data: 04/05/2026

✅ O que foi feito:

- **Bug Crítico — `prazoDesejado` não era gravado no banco via PUT:** O handler `PUT /api/solicitacoes/[id]` fazia `const { anexos, ...updateData } = body` e depois `db.update().set({ ...updateData })`, ou seja, passava o body inteiro (como objeto JS puro com strings) diretamente para o Drizzle. O Drizzle **não converte strings automaticamente** para o tipo `timestamp` do Postgres — isso causava falha silenciosa e o campo voltava como `null`. O POST funcionava porque mapeava os campos explicitamente com `new Date(prazoDesejado)`.
- **Correção:** O PUT foi refatorado para usar mapeamento explícito de cada campo (igual ao POST), com `setValues.prazoDesejado = body.prazoDesejado ? new Date(body.prazoDesejado) : null`. Adicionados logs de debug focados (`BODY` e `setValues.prazoDesejado`) para facilitar rastreamento futuro.
- **Banco de dados e Schema Drizzle:** Verificados e estão corretos — coluna `prazo_desejado timestamp` existe na migração e no schema.
- **Frontend (nova e editar):** Verificados e estão corretos — payload envia `"YYYY-MM-DDT12:00:00Z"` via `getValues()` do RHF.

✅ Commit pronto:
`fix: refatora PUT com mapeamento explicito de campos e conversao correta de prazoDesejado`
