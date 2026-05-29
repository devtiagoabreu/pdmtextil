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

---

## FASE 2: Expansão do Sistema (05/05 a 17/05/2026)

**~110 commits — resumo por feature**

---

### Dashboard Dados Reais

**Data:** 05/05/2026

Dashboard passa a consumir dados reais do banco (cards de total solicitações, por status, por departamento).

**Commits:**
- `374a1c5` feat: dashboard busca dados reais do banco
- `249eb92` fix: layout ajusta links abaixo do briefing

---

### Landing Page com Animação

**Data:** 05-06/05/2026

Landing page substitui redirect para login, com animação canvas de tear e tooltip explicativo.

**Commits:**
- `9d74902` feat: cria landingpage com animacao abstrata de tear
- `26a1877` feat: atualiza landingpage com significado do PDM e modulo DES
- `3eac645` feat: atualiza significado completo do PDM
- `e663cc2` feat: atualiza landingpage com tooltip e PDM.PRO.TEXTIL
- `4582d13` feat: tooltip above title with correct styling
- `4e07999` style: atualiza textos da landing page

---

### Módulo de Cadastros Base (Fios, Fornecedores, Cores, Estampas, Bases Urdume)

**Data:** 05-07/05/2026

Implementação completa dos CRUDs de cadastros:
- Fios com schema Drizzle, API, formulário
- Fornecedores com relação N:N (fios_fornecedores)
- Cores Sólidas, Estampas, Bases de Urdume
- Padrão simples (sem Zod/RHF) adotado para formulários
- Modal para criar fornecedor inline no fio
- Migrations manuais via script Node.js

**Arquivos criados:** schemas, APIs (GET/POST/PUT/DELETE), páginas de lista e formulário para cada entidade.

**Commits:**
- `c101556` feat: adiciona modulo de cadastros - schema e pagina de fios
- `439eb39` fix: corrige tipo decimal para numeric nos schemas
- `c3280da` fix: corrige tipos numeric no Drizzle
- `4b0eee5` fix: adiciona import text no schema de cores
- `74d7402` feat: adiciona API de migration para criar tabelas
- `7ab65df` feat: adiciona script npm run db:migrate
- `96afe63` feat: adiciona modulo de fornecedores com relacao N:N aos fios
- `7e5316d` fix: corrige icon Thread e adiciona campo ativo na interface Fornecedor
- `8d053fc` fix: corrige icon Bobbin para Fios
- `8c83931` fix: usa icon Package para Fios
- `86a8422` fix: remove campo fornecedor obsoleto das APIs de fios
- `527f999` feat: adiciona Clientes ao menu Cadastros
- `3d7ff41` fix: permite adicionar fornecedores após criar fio
- `67d7851` feat: adiciona cadastros de bases de urdume, cores solidas e estampas
- `7819253` feat: completa CRUD de bases-urdume, cores solidas e estampas
- `5941584` fix: corrige validacao Zod em formularios de cadastros
- `d913a4f` fix: corrige validacao Zod com z.coerce.boolean e null
- `0e3971c` debug: adiciona logs no submit de cores
- `9027242` refactor: refatora cadastros para padrao simples (sem Zod/RHF)
- `4bb959b` refactor: refatora fios e fornecedores para padrao simples
- `1830959` debug: adiciona logs em fios submit e API
- `b18d18e` feat: adiciona botao para cadastrar fornecedor no modal
- `efa6bbd` fix: corrige erro de sintaxe em fios
- `56c1665` fix: corrige type error no catch da API de fios
- `87bdc28` feat: adiciona modal para criar fornecedor diretamente no fio
- `4cc2a0f` fix: corrige CSS modo escuro na seção de fornecedores do fio
- `0451d13` fix: toast duration 1s para msgs de fornecedor
- `864795b` fix: cria rota DELETE separada para fornecedor do fio

---

### Campo idIntegracao em Todos os Cadastros

**Data:** 07-08/05/2026

Adicionado campo `id_integracao` (varchar 100) em todas as tabelas para integração com sistemas externos (ERP, CRM, WMS). Label padronizado como "ID Integração (ERP/WMS/CRM/OUTROS)".

**Commits:**
- `eddd9f9` feat: adiciona campo idIntegracao em todas as tabelas para integracao com sistemas externos
- `7ae0b75` debug: adiciona logs nas APIs de cadastros para debugar dados
- `af74c6e` feat: adiciona API de migracao manual para adicionar idIntegracao
- `e494a97` feat: adiciona API publica para adicionar idIntegracao
- `46d5d6d` feat: adiciona idIntegracao na API de migrate
- `f5d5e9e` feat: adiciona pasta .agent com skills e histórico
- `ff818e9` style: remove textos entre parênteses dos subtítulos dos cadastros
- `51cc67a` feat: adiciona campo idIntegracao em todos os CRUDs de cadastros
- `b27a08c` fix: atualiza label idIntegracao para genérico (ERP/WMS/CRM/OUTROS)
- `a343613` feat: adiciona campo idIntegracao no CRUD de clientes

---

### Importação CSV/JSON em Massa

**Data:** 08/05/2026

Importação via CSV/JSON para todos os cadastros. Inclui:
- API de modelo (download CSV/JSON com exemplo)
- API de importação (parse CSV com mapa campoMap camelCase)
- Componente modal `ImportarX.tsx` para cada entidade
- Validação de duplicados (campos únicos + idIntegracao)
- Validação de CNPJ duplicado no update
- Normalização de line endings Windows (`\r\n`)
- Tratamento de separador `;` (padrão brasileiro)

**Commits:**
- `e871589` feat: adiciona importação de fios via CSV/JSON
- `29419cd` fix: altera separador do CSV para ponto e vírgula (padrão brasileiro)
- `09c7e67` fix: corrige parsing CSV para suportar line endings Windows (\r\n)
- `0e9140c` fix: adiciona logs de debug na API de importação de fios
- `667a05a` feat: logs adicionados no browser
- `bc7d70b` feat: logs adicionados no servidor
- `0c7b798` fix: corrige mapeamento de campos camelCase no parsing CSV
- `0c67ca0` feat: adiciona importação CSV/JSON em massa para todos os cadastros
- `3cfb6a1` feat: adiciona logs de debug nas APIs de importação de estampas, bases-urdume e clientes
- `ac4c2a5` fix: corrige tipo NewBaseUrdume para campos numeric na importação
- `7ff93a9` fix: remove parseFloat dos campos numeric na importação de bases-urdume
- `a0adae9` fix: exibe lista de erros na UI de importação
- `28e8092` fix: improved error handling and validation for bases-urdume import
- `82da9ee` fix: valida CNPJ duplicado antes de inserir fornecedores e clientes
- `c7248f8` fix: valida idIntegracao duplicado em todas as APIs de importação
- `8fec1eb` fix: valida CNPJ e idIntegracao duplicados no update de todos os cadastros
- `b27a08c` fix: atualiza label idIntegracao para genérico

---

### Módulo Produto Cru (Tecido Cru)

**Data:** 09-13/05/2026

Módulo completo de Produto Cru com engenharia têxtil:
- Schema: `produtos_cru`, `composicao`, `estrutura`, `amostras`, `acabamentos`, `amostras_acabamento`
- Páginas de cadastro com formulário completo
- Composição com percentuais, estrutura (urdume/trama), amostras com status
- Vinculação de produtos cru na solicitação
- Graphify adicionado ao projeto

**Commits:**
- `c93a39b` feat: inserindo graphify no projeto
- `4f2a067` feat: adiciona módulo completo de cadastro de Produto Cru (tecido cru)
- `2fa7438` feat: adiciona migration das tabelas de Produto Cru
- `44590e6` fix: retorna mensagem de erro detalhada na API de composicao
- `2c6d126` fix: corrige shorthand percentual sem declaracao no values
- `7c7bab5` feat: adiciona seletor de status nas amostras (tecido cru e acabamento)
- `4203f3f` feat: motivo obrigatorio ao aprovar/reprovar amostras + restricao por role
- `8e54da9` feat: exibe produtos cru vinculados na solicitacao
- `721967e` fix: estrutura JSX correta - produtos fora do conditional anexos
- `ddccb98` feat: criando insights - 0001

---

### Sistema de Notificações e Email + Admin

**Data:** 13/05/2026

Sistema completo de notificações com:
- Tabela `notificacoes` e `email_config`
- Sino de notificações no header com polling 30s e badge
- Config SMTP no admin
- Disparo de email em massa
- Gerenciamento de usuários e roles (CRUD)
- nodemailer@7 corrigido para compatibilidade com @auth/core

**Commits:**
- `fbd87a7` feat: sistema de notificacoes e email (sino, smtp, config, usuarios, admin, email massa, disparo automatico)
- `811830f` fix: bump nodemailer to v7 compativel com @auth/core
- `1a46271` fix: aceita null no usuarioNome do notificar
- `ab61944` feat: tabela roles + gerenciamento de perfis no admin
- `45182ca` fix: adiciona ativo na interface Role
- `7356702` feat: edicao de roles com PUT e checkbox ativo

---

### Produtos Químicos + Receitas de Beneficiamento

**Data:** 13-17/05/2026

- CRUD completo de `produtos_quimicos` com idIntegracao
- API de importação CSV/JSON para produtos químicos
- Schema `produto_cru_receita` e `produto_cru_receita_item` vinculado à amostra
- Modal `ReceitaDialog` para criar/editar receitas por amostra (químico, unidade, qtd/m, estágio)
- Correções de build Vercel (Next.js 14.2.0, Drizzle type inference, JSX)
- Padronização da página de listagem de produtos químicos (uso do componente modal ImportarProdutosQuimicos igual ao padrão de fios)

**Commits:**
- `4c7b333` feat: receitas de beneficiamento com produtos quimicos + cadastro + dialog por amostra
- `ad2e0ce` fix: compatibilidade Next.js 14 e remove refs obsoletas
- `b368275` fix: fecha </form> apenas no final do componente
- `34bc49d` fix: reescreve page.tsx do produto-cru eliminando todos os vestigios de syntax error
- `536cdb4` fix: importa receitas como produtoCruReceita em vez de receitas
- `9111574` fix: drizzle query sem reassign + remove desc nao usado
- `2dce72c` fix: returning() do drizzle retorna objeto ou array conforme versao
- `35db209` feat: adiciona campo idIntegracao (ERP) no cadastro de produtos quimicos
- `39e2b62` fix: import de produtos quimicos com ref, delim detection, sem restricao admin
- `53b6aa3` refactor: padroniza pagina de produtos quimicos com modal de import e estilo igual fios

---

### Integrações com API Externa + Importação via API

**Data:** 28-29/05/2026

- Módulo de Integrações completo (schema `integracoes`, API CRUD, página em Configurações)
- Suporte a 4 tipos de autenticação: OAuth2 (Client Credentials via Basic Auth), Bearer, Basic, API Key
- Proxy de teste server-side que monta autenticação e executa GET contra API externa
- Colunas `telas` (JSON array) e `mapping` (JSON com fields + uniqueKey) na tabela
- Editor visual de mapeamento de campos com "Carregar campos da API" e dropdowns PDM
- Botão "Importar via API" na tela de Clientes com modal genérico reutilizável
- Importação com grid, checkboxes, dedup automático por idIntegracao/CNPJ
- Campo de busca/pesquisa em tempo real no grid do modal
- Correções de build Vercel (interface Integracao, exhaustive-deps)
- OAuth2 corrigido: client_id/secret enviados via Basic Auth header (não no body)

**Commits:**
- `b88689e` fix: add quantidadeProduzida to Amostra types in produto-cru page
- `b269989` feat: add integracoes module (schema, API, CRUD page, config hub card)
- `0d4a407` feat: add test endpoint for integracoes (frontend button + API proxy)
- `abc43be` fix: send OAuth2 client credentials via Basic Auth header
- `3c2fc6d` feat: add field mapping, screen config, and API import modal for clientes
- `253603a` fix: add ativo to Integracao interface, remove useCallback warning
- `c1691dc` feat: visual field mapping editor for integracoes
- `aa4cf6f` fix: translate uniqueKey from API field to PDM field in import dedup check
- `25f807c` feat: add search filter in import API modal grid