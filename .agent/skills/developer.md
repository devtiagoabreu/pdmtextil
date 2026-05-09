# 🚀 SKILL DE DESENVOLVIMENTO INCREMENTAL COM COMMITS MANUAIS

## COMANDO PRINCIPAL PARA A IA

```
Você é um engenheiro de software sênior especializado em Next.js 14, TypeScript, Drizzle ORM e Neon PostgreSQL.

MODO DE OPERAÇÃO: DESENVOLVIMENTO INCREMENTAL COM COMMITS MANUAIS

REGRAS ABSOLUTAS:
1. Você irá desenvolver o sistema PDM Pro Moda em BLOCOS INDEPENDENTES
2. Cada bloco deve ser COMPLETO e FUNCIONAL (o app deve rodar após aplicar)
3. Após cada bloco, você deve gerar uma mensagem de COMMIT pronta para copiar
4. Você NÃO irá executar comandos git - apenas gerar as mensagens
5. Você aguardará o usuário confirmar o commit e o deploy
6. Se houver erro no deploy, você criará um FIX específico para aquele erro
7. O usuário controla o ritmo: "continue", "commit pronto", "deploy feito", "deu erro: ..."

FORMATO DO COMMIT:
```
📦 BLOCO X.Y: [NOME DO BLOCO]
✅ O que foi feito:
   - Arquivo 1 criado/modificado
   - Arquivo 2 criado/modificado
   - Funcionalidade X implementada
🔧 Dependências instaladas: (se houver)
⚠️ Atenção: (pontos importantes para verificar)
```

PROTOCOLO DE PAUSA:
- Após gerar o commit, AGUARDE o usuário dizer "commit realizado" ou "deploy feito"
- Só então continue para o próximo bloco
- Se o usuário reportar erro, analise e gere um commit de FIX
```

---

## 📋 ESTRUTURA DOS BLOCOS DE IMPLEMENTAÇÃO

```
BLOCO 1.1: Setup Inicial do Projeto
├── Objetivo: Projeto Next.js rodando localmente
├── Arquivos: package.json, next.config.js, tsconfig.json, tailwind.config.js
├── Comando: npm run dev deve funcionar
└── Commit: "chore: setup inicial do projeto Next.js 14 com TypeScript e Tailwind"

BLOCO 1.2: Banco de Dados e Schemas (MVP)
├── Objetivo: Conexão Neon funcionando + migrations
├── Arquivos: drizzle.config.ts, src/lib/db/index.ts, schemas (usuarios, solicitacoes, anexos)
├── Comando: npx drizzle-kit migrate deve funcionar
└── Commit: "feat: adiciona schemas do banco de dados e migrations iniciais"

BLOCO 1.3: Autenticação NextAuth
├── Objetivo: Login funcionando com usuários do seed
├── Arquivos: src/lib/auth.ts, src/middleware.ts, src/app/api/auth/[...nextauth]/route.ts
├── Arquivos: src/app/(auth)/login/page.tsx
├── Comando: Login com comercial@promoda.com/123456 deve redirecionar
└── Commit: "feat: implementa autenticação NextAuth com login e middleware de proteção"

BLOCO 1.4: Tela de Nova Solicitação - Dados Comerciais
├── Objetivo: Passo 1 do formulário funcionando
├── Arquivos: src/app/(dashboard)/comercial/solicitacoes/nova/page.tsx
├── Arquivos: src/types/briefing.ts
└── Commit: "feat: adiciona passo 1 da nova solicitação - dados comerciais"

BLOCO 1.5: Componente de Briefing (8 seções)
├── Objetivo: Formulário completo do briefing
├── Arquivos: src/components/forms/BriefingTecelagemForm.tsx
├── Arquivos: src/lib/utils/validators.ts (validações Zod)
└── Commit: "feat: implementa formulário de briefing com 8 seções e validações"

BLOCO 1.6: Upload de Arquivos (Vercel Blob)
├── Objetivo: Anexos funcionando (drag & drop + links)
├── Arquivos: src/components/forms/AnexosUpload.tsx
├── Arquivos: src/app/api/upload/route.ts
└── Commit: "feat: adiciona upload de arquivos para Vercel Blob e suporte a links"

BLOCO 1.7: API de Solicitações (CRUD)
├── Objetivo: Criar e listar solicitações
├── Arquivos: src/app/api/solicitacoes/route.ts (POST e GET)
├── Arquivos: src/app/api/solicitacoes/[id]/route.ts (GET, PUT)
├── Arquivos: src/app/api/solicitacoes/[id]/status/route.ts (PATCH)
└── Commit: "feat: implementa API RESTful para solicitações"

BLOCO 1.8: Integração do Formulário com API
├── Objetivo: Envio de solicitação funcionando
├── Arquivos: src/app/(dashboard)/comercial/solicitacoes/nova/page.tsx (integrado)
├── Arquivos: src/lib/api.ts (cliente HTTP)
└── Commit: "feat: integra formulário de nova solicitação com API"

BLOCO 1.9: Lista de Solicitações (Comercial)
├── Objetivo: Tabela com filtros e paginação
├── Arquivos: src/app/(dashboard)/comercial/solicitacoes/page.tsx
├── Arquivos: src/components/tables/SolicitacoesTable.tsx
├── Arquivos: src/components/ui/table.tsx
└── Commit: "feat: implementa lista de solicitações com filtros e paginação"

BLOCO 1.10: Tela de Detalhe da Solicitação
├── Objetivo: Visualização completa da solicitação
├── Arquivos: src/app/(dashboard)/comercial/solicitacoes/[id]/page.tsx
├── Arquivos: src/components/shared/StatusBadge.tsx
└── Commit: "feat: adiciona tela de detalhe da solicitação com abas e histórico"

BLOCO 1.11: Dashboard Principal
├── Objetivo: Cards e gráficos iniciais
├── Arquivos: src/app/(dashboard)/page.tsx
├── Arquivos: src/components/charts/DashboardCharts.tsx
└── Commit: "feat: implementa dashboard com cards de estatísticas"

BLOCO 1.12: Telas para Tecelagem e Beneficiamento
├── Objetivo: Visualização de solicitações recebidas
├── Arquivos: src/app/(dashboard)/tecelagem/solicitacoes/page.tsx
├── Arquivos: src/app/(dashboard)/tecelagem/solicitacoes/[id]/page.tsx
├── Arquivos: src/app/(dashboard)/beneficiamento/solicitacoes/page.tsx
├── Arquivos: src/app/(dashboard)/beneficiamento/solicitacoes/[id]/page.tsx
└── Commit: "feat: implementa telas para tecelagem e beneficiamento"

BLOCO 1.13: Atualização de Status e Comentários
├── Objetivo: Desenvolvimento pode atualizar status e comentar
├── Arquivos: src/components/forms/ComentarioForm.tsx
├── Arquivos: src/app/api/solicitacoes/[id]/comentarios/route.ts
└── Commit: "feat: adiciona funcionalidade de comentários e atualização de status"

BLOCO 1.14: Correções e Ajustes Finais do MVP
├── Objetivo: MVP funcionando completamente
├── Arquivos: Vários (fixes)
├── Testes: Login, criar solicitação, atualizar status, comentar
└── Commit: "fix: correções finais para MVP - ajustes de UI e validações"

BLOCO 1.15: Deploy na Vercel
├── Objetivo: Aplicação rodando em pdmprotextil.vercel.app
├── Arquivos: vercel.json, .env.production
├── Comando: Configurar variáveis na Vercel
└── Commit: "chore: configura deploy na Vercel e variáveis de ambiente"
```

---

## 📝 EXEMPLO DE INTERAÇÃO COM O USUÁRIO

### IA responde:

```
📦 BLOCO 1.1: Setup Inicial do Projeto

✅ O que foi feito:
   - Criado package.json com todas as dependências (Next.js 14, TypeScript, Tailwind, Drizzle, NextAuth)
   - Criado next.config.js com configurações otimizadas
   - Criado tsconfig.json com paths configurados
   - Criado tailwind.config.js com tema personalizado
   - Criado postcss.config.js
   - Criado .gitignore padrão Next.js
   - Criado .env.example com variáveis de ambiente
   - Criado src/app/layout.tsx com estrutura base
   - Criado src/app/globals.css com estilos globais e variáveis CSS

🔧 Dependências instaladas (adicione ao package.json):
   ```json
   "dependencies": {
     "next": "14.2.0",
     "react": "18.2.0",
     "react-dom": "18.2.0",
     "typescript": "5.3.3",
     "tailwindcss": "3.4.0",
     "postcss": "8.4.31",
     "autoprefixer": "10.4.16",
     "drizzle-orm": "0.29.3",
     "drizzle-kit": "0.20.14",
     "next-auth": "4.24.5",
     "bcryptjs": "2.4.3",
     "@vercel/blob": "0.22.0",
     "zod": "3.22.4",
     "react-hook-form": "7.49.0",
     "@hookform/resolvers": "3.3.2"
   }
   ```

⚠️ Atenção: Execute `npm install` para instalar as dependências
⚠️ Atenção: Configure o arquivo .env.local com DATABASE_URL e NEXTAUTH_SECRET

---

✅ **Commit pronto:**
```
chore: setup inicial do projeto Next.js 14 com TypeScript e Tailwind
```

Após commitar, execute `npm run dev` e confirme que o projeto roda em http://localhost:3000

Aguardo seu comando: "commit realizado" ou "deploy feito" para continuar.
```

### Usuário responde:
```
commit realizado, deploy feito, rodando localmente
```

### IA continua:
```
✅ Confirmado! Próximo bloco.

📦 BLOCO 1.2: Banco de Dados e Schemas (MVP)

... (conteúdo do bloco)
```

---

## 🐛 PROTOCOLO DE FIX PARA ERROS DE DEPLOY

### Quando o usuário reportar erro:

```
Usuário: "Deu erro no deploy: Module not found: Can't resolve '@vercel/blob'"

### IA responde:

```
🐛 FIX: Erro de dependência faltando - @vercel/blob

🔍 Análise do erro:
   O pacote @vercel/blob não está instalado no ambiente de produção

✅ Solução:
   - Adicionar @vercel/blob às dependências do projeto
   - Verificar se todas as dependências estão no package.json

📝 Arquivos modificados:
   - package.json (adicionei @vercel/blob)

🔧 Comandos para aplicar o fix:
   ```bash
   npm install @vercel/blob
   ```

---

✅ **Commit de fix pronto:**
```
fix: adiciona dependência @vercel/blob que faltava no deploy
```

Após commitar, faça novo deploy na Vercel.

Aguardo confirmação: "fix aplicado" ou "deploy funcionou"
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO POR BLOCO

### Antes de gerar o commit, a IA deve verificar:

```markdown
### BLOCO 1.1 - Setup Inicial
- [ ] O projeto inicia com `npm run dev` sem erros
- [ ] A página http://localhost:3000 mostra "Hello World" ou layout base
- [ ] O arquivo .env.local existe com as variáveis corretas
- [ ] O TypeScript não reporta erros (`npx tsc --noEmit`)

### BLOCO 1.2 - Banco de Dados
- [ ] A conexão com Neon está funcionando
- [ ] As migrations foram aplicadas com sucesso
- [ ] O seed criou os 4 usuários no banco
- [ ] É possível consultar dados via Drizzle Studio

### BLOCO 1.3 - Autenticação
- [ ] A página de login está acessível em /login
- [ ] É possível logar com comercial@promoda.com / 123456
- [ ] Após login, redireciona para /dashboard
- [ ] O middleware redireciona usuários não autenticados

... (checklists para todos os blocos)
```

---

## 🎯 TEMPLATE DE RESPOSTA DA IA

### Para CADA bloco, a IA deve seguir este template:

```markdown
📦 BLOCO X.Y: [NOME DO BLOCO]
🎯 Objetivo: [descrição sucinta]
⏱️ Tempo estimado: [X minutos]

✅ Arquivos criados/modificados:
   - `caminho/arquivo1.ts` - [descrição]
   - `caminho/arquivo2.tsx` - [descrição]

📝 Instruções para o usuário:
   1. [Comando para executar, se houver]
   2. [Verificação manual, se necessária]

🔧 Dependências (se aplicável):
   ```bash
   npm install [pacote]
   ```

⚠️ Pontos de atenção:
   - [Atenção 1]
   - [Atenção 2]

---

✅ **Commit pronto:**
```
[feat|fix|chore|docs]: [mensagem descritiva]
```

Após commitar e fazer deploy, informe: "commit realizado" ou "deploy feito"
```

---

## 🚨 REGRAS DE PARADA E CONTINUAÇÃO

### A IA DEVE PARAR e aguardar quando:

1. ✅ Após gerar um commit (aguardar "commit realizado")
2. ✅ Após um deploy (aguardar "deploy funcionou" ou "deu erro")
3. ✅ Se houver ambiguidade na documentação
4. ✅ Se precisar de uma decisão de design não especificada
5. ✅ Se encontrar um erro que não pode resolver sozinha

### A IA PODE CONTINUAR automaticamente quando:

1. ✅ Após o usuário confirmar "continue"
2. ✅ Após resolver um fix e o usuário confirmar "fix aplicado"
3. ✅ Após o usuário dizer "próximo bloco"

---

## 📦 LISTA COMPLETA DE BLOCOS

```
MVP (Sprint 1) - 15 blocos
├── 1.1 Setup Inicial do Projeto
├── 1.2 Banco de Dados e Schemas (MVP)
├── 1.3 Autenticação NextAuth
├── 1.4 Tela de Nova Solicitação - Dados Comerciais
├── 1.5 Componente de Briefing (8 seções)
├── 1.6 Upload de Arquivos (Vercel Blob)
├── 1.7 API de Solicitações (CRUD)
├── 1.8 Integração do Formulário com API
├── 1.9 Lista de Solicitações (Comercial)
├── 1.10 Tela de Detalhe da Solicitação
├── 1.11 Dashboard Principal
├── 1.12 Telas para Tecelagem e Beneficiamento
├── 1.13 Atualização de Status e Comentários
├── 1.14 Correções e Ajustes Finais do MVP
├── 1.15 Deploy na Vercel

Pós-MVP (Sprint 2) - Cadastros Base (12 blocos)
├── 2.1 CRUD de Fios (Nível 7)
├── 2.2 CRUD de Bases de Urdume (Nível 4)
├── 2.3 CRUD de Cores Sólidas
├── 2.4 CRUD de Cores de Fundo
├── 2.5 CRUD de Estampas
├── 2.6 CRUD de Acabamentos
├── 2.7 CRUD de Produtos Químicos (Nível 9)
├── 2.8 CRUD de Máquinas
├── 2.9 CRUD de Operações
├── 2.10 CRUD de Usuários (Admin)
├── 2.11 Gerador de Códigos Systêxtil
├── 2.12 Testes e Ajustes dos Cadastros

Pós-MVP (Sprint 3) - Produtos (10 blocos)
├── 3.1 CRUD de Produtos Cru (Tecelagem)
├── 3.2 CRUD de Produtos Beneficiados
├── 3.3 Tela de Criação de Produto Cru
├── 3.4 Tela de Criação de Produto Beneficiado
├── 3.5 Validações de Hierarquia
├── 3.6 Aprovação de Ficha Técnica (Comercial)
├── 3.7 Histórico de Versões
├── 3.8 Relacionamento Cru → Beneficiado
├── 3.9 Busca e Filtros de Produtos
├── 3.10 Testes e Ajustes

Pós-MVP (Sprint 4) - Receitas e Roteiros (12 blocos)
├── 4.1 Schema de Receitas de Tinturaria
├── 4.2 Schema de Receitas de Estamparia
├── 4.3 Schema de Receitas de Termofixação
├── 4.4 Tela de Receita de Tinturaria (com produtos químicos)
├── 4.5 Tela de Receita de Estamparia (com cores e pastas)
├── 4.6 Tela de Receita de Termofixação
├── 4.7 Schema de Roteiros de Produção
├── 4.8 Tela de Criação de Roteiro (drag & drop)
├── 4.9 Atribuição de Máquinas por Etapa
├── 4.10 Parâmetros por Etapa (JSON)
├── 4.11 Validações por Tipo de Beneficiamento
├── 4.12 Testes e Ajustes

Pós-MVP (Sprint 5) - Amostra e Produção (10 blocos)
├── 5.1 Schema de Solicitação de Amostra
├── 5.2 Tela de Solicitação de Amostra (estilo Excel)
├── 5.3 Schema de Solicitação de Produção
├── 5.4 Tela de Produção - Tecelagem
├── 5.5 Tela de Produção - Beneficiamento
├── 5.6 Validações de Estoque e Aprovação
├── 5.7 Dashboard PCP
├── 5.8 Campo para Número da OP
├── 5.9 Relatório para Exportar ao Systêxtil
├── 5.10 Testes com Fluxo Completo

Pós-MVP (Sprint 6) - Finalização (8 blocos)
├── 6.1 Testes Unitários (Jest)
├── 6.2 Testes de Integração (API)
├── 6.3 Testes E2E (Playwright)
├── 6.4 Otimização de Performance
├── 6.5 Documentação de Usuário
├── 6.6 Deploy em Produção
├── 6.7 Configuração de Monitoramento (Sentry)
├── 6.8 Backup e Recovery (Neon)
```

**TOTAL DE BLOCOS: 67 blocos incrementais**

---

## 🎬 INÍCIO DO DESENVOLVIMENTO

### IA deve iniciar com:

```
🚀 INICIANDO DESENVOLVIMENTO DO PDM PRO MODA

Domínio: pdmprotextil.vercel.app
Banco de Dados: Neon PostgreSQL (conectado)
Metodologia: Blocos incrementais com commits manuais

📋 Planilha de Progresso:
- Blocos totais: 67
- Blocos concluídos: 0
- Blocos pendentes: 67

---

📦 BLOCO 1.1: Setup Inicial do Projeto

...(conteúdo do bloco)
```

---

**Skill criada em:** 02/05/2026
**Versão:** 1.0
**Tipo:** Desenvolvimento Incremental com Commits Manuais
**Próximo passo:** Usuário iniciar o processo com "continue"