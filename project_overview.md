# PDM PRO MODA - DOCUMENTAÇÃO COMPLETA DO SISTEMA (CONTINUAÇÃO)

# PDM PRO MODA - DOCUMENTAÇÃO COMPLETA DO SISTEMA

## DOCUMENTO TÉCNICO E FUNCIONAL PARA DESENVOLVIMENTO

---

# ÍNDICE GERAL

1. [VISÃO GERAL DO PROJETO](#1-visão-geral-do-projeto)
2. [ARQUITETURA E TECNOLOGIA](#2-arquitetura-e-tecnologia)
3. [REGRAS DE NEGÓCIO FUNDAMENTAIS](#3-regras-de-negócio-fundamentais)
4. [ESTRUTURA DE CÓDIGOS SYSTÊXTIL](#4-estrutura-de-códigos-systêxtil)
5. [MODELO DE DADOS (BANCO DE DADOS)](#5-modelo-de-dados-banco-de-dados)
6. [FLUXOS DE TRABALHO COMPLETOS](#6-fluxos-de-trabalho-completos)
7. [PERFIS E PERMISSÕES](#7-perfis-e-permissões)
8. [TELAS E INTERFACES (MVP)](#8-telas-e-interfaces-mvp)
9. [TELAS E INTERFACES (PÓS-MVP)](#9-telas-e-interfaces-pós-mvp)
10. [REGRAS DE VALIDAÇÃO E NEGÓCIO](#10-regras-de-validação-e-negócio)
11. [INTEGRAÇÕES E SERVIÇOS EXTERNOS](#11-integrações-e-serviços-externos)
12. [CONFIGURAÇÕES DE AMBIENTE](#12-configurações-de-ambiente)
13. [CRONOGRAMA DE DESENVOLVIMENTO](#13-cronograma-de-desenvolvimento)
14. [GLOSSÁRIO TÉCNICO](#14-glossário-técnico)

---

# 1. VISÃO GERAL DO PROJETO

## 1.1 Nome do Projeto
**PDM Pro Moda** (Product Data Management para Indústria Têxtil)

## 1.2 Propósito
Sistema de gestão de desenvolvimento de produtos têxteis que conecta os departamentos Comercial, Desenvolvimento (Tecelagem e Beneficiamento) e PCP, centralizando solicitações, fichas técnicas, receitas e roteiros de produção.

## 1.3 Problemas que Resolve

| Problema | Impacto | Solução do Sistema |
|----------|---------|---------------------|
| Comunicação via email/WhatsApp | Informações perdidas, sem rastreabilidade | Centralização de todas solicitações |
| Fichas técnicas em Excel | Versões conflitantes, sem histórico | Controle de versão e aprovações |
| PCP recebe informações incompletas | Erros de produção, retrabalho | Ficha técnica completa antes da OP |
| Códigos fora do padrão Systêxtil | Inconsistência no ERP | Gerador automático de códigos |
| Briefing comercial insuficiente | Desenvolvimento errado, desperdício | Briefing estruturado com 7 seções obrigatórias |
| Sem rastreabilidade de aprovações | Quem aprovou o quê? | Log completo de aprovações |

## 1.4 Escopo do Projeto

### MVP (Fase 1 - Entrega Inicial)

| Módulo | Funcionalidade | Descrição |
|--------|----------------|-----------|
| Autenticação | Login de usuários | Sistema com perfis COMERCIAL, TECELAGEM, BENEFICIAMENTO, ADMIN |
| Solicitação de Desenvolvimento | Criar solicitação | Comercial preenche briefing de 7 seções |
| | Anexar arquivos/links | Upload de imagens, PDFs, links do YouTube/Google |
| | Enviar para desenvolvimento | Notifica os departamentos |
| Visualização | Listar solicitações | Por status, por tipo, com filtros |
| | Detalhar solicitação | Briefing completo + anexos + histórico |
| Acompanhamento | Atualizar status | Desenvolvimento muda status (EM_ANÁLISE, AGUARDANDO_INFO, CONCLUÍDO) |
| | Histórico de comunicação | Registro de todas interações |

### Pós-MVP (Fase 2 - Cadastros e Fichas Técnicas)

| Módulo | Funcionalidade | Descrição |
|--------|----------------|-----------|
| Cadastros Base | Fios (Nível 7) | CRUD completo, composição, título, fornecedor |
| | Bases de Urdume (Nível 4) | Composição de fios, densidade, tratamento |
| | Produtos Cru (Nível 2) | Ligamento, gramatura, largura, densidades |
| | Cores (sólidas) | Código de 6 dígitos, nome, Pantone |
| | Cores de Fundo | Código de 3 dígitos para estampados |
| | Estampas | Desenho (4) + Variante (2), imagem |
| | Acabamentos | Lista de acabamentos disponíveis |
| | Produtos Químicos (Nível 9) | Corantes, auxiliares, resinas |
| | Máquinas | Código, nome, tipo, capacidade |
| | Operações | Preparar, Tingir, Secar, Estampar, etc |

### Pós-MVP (Fase 3 - Produtos e Fichas Técnicas)

| Módulo | Funcionalidade | Descrição |
|--------|----------------|-----------|
| Produtos Beneficiados | Criar produto | Baseado em cru existente |
| | Gerar código automático | Conforme padrão Systêxtil |
| | Associar cor/estampa | Para tingidos e estampados |
| Fichas Técnicas | Completa do cru | Urdume + Trama + Liga

# 1. VISÃO GERAL DO PROJETO (CONTINUAÇÃO)

## 1.4 Escopo do Projeto (Continuação)

### Pós-MVP (Fase 4 - Receitas e Roteiros)

| Módulo | Funcionalidade | Descrição |
|--------|----------------|-----------|
| Receitas de Tinturaria | Criar receita | Para produtos TIN (tingidos) e ALVEJADOS |
| | Produtos químicos | Lista de corantes e auxiliares com quantidades |
| | Curva de tingimento | Temperatura, tempo, rampa por etapa |
| | Parâmetros térmicos | pH, relação de banho, temperatura final |
| Receitas de Termofixação | Criar receita | Para produtos TER |
| | Temperatura por zona | Configuração de cada câmara da rama |
| | Velocidade e overfeed | Parâmetros de processo |
| Receitas de Estamparia | Criar receita | Para produtos estampados |
| | Cores da estampa | Lista de cores com pastas e formulações |
| | Fixação | Tipo (vapor, secagem), temperatura, tempo |
| Roteiros de Produção | Sequência de operações | Ordem das etapas (PREPARAR → TINGIR → SECAR → ACABAR) |
| | Máquinas por etapa | Qual máquina será usada em cada operação |
| | Parâmetros por etapa | Configurações específicas |
| | Tempos padrão | Setup e processamento |

### Pós-MVP (Fase 5 - Solicitações de Amostra e Produção)

| Módulo | Funcionalidade | Descrição |
|--------|----------------|-----------|
| Solicitação de Amostra | Criar pedido | Comercial solicita amostra do produto desenvolvido |
| | Itens múltiplos | Pode solicitar várias amostras na mesma requisição |
| | Acompanhamento | PCP atualiza status (PENDENTE, EM_PRODUCAO, CONCLUIDA, ENTREGUE) |
| Solicitação de Produção - Tecelagem | Criar pedido | Comercial solicita produção do tecido cru |
| | Quantidade e prazo | Informar metros e data desejada |
| | Validação | Produto cru precisa ter FT aprovada |
| Solicitação de Produção - Beneficiamento | Criar pedido | Comercial solicita beneficiamento de cru existente |
| | Cru em estoque | Valida se o cru está disponível |
| | Produto beneficiado | Precisa ter FT e receita aprovadas |
| Integração com Systêxtil | Gerar dados para OP | Exportar dados estruturados para digitação manual |

## 1.5 Usuários e Personas

### Persona 1: Ana (Comercial)

| Atributo | Descrição |
|----------|-----------|
| Função | Analista de Produto / Vendedora Técnica |
| Objetivo | Abrir solicitações de desenvolvimento de forma rápida e completa |
| Dores | Perde informações no email, briefing chega incompleto para tecelagem, retrabalho |
| Necessidades no sistema | Formulário intuitivo, anexar referências, acompanhar status, receber notificações |
| Frequência de uso | Diária (5-10 solicitações por semana) |
| Dispositivo | Desktop (escritório) + Tablet (feiras/ clientes) |

### Persona 2: Carlos (Desenvolvimento Tecelagem)

| Atributo | Descrição |
|----------|-----------|
| Função | Engenheiro Têxtil / Desenvolvedor de Tecidos |
| Objetivo | Receber briefings claros, desenvolver ficha técnica do cru |
| Dores | Briefing incompleto, falta informações de uso final, várias versões da mesma FT |
| Necessidades no sistema | Visualizar briefing completo, cadastrar produtos cru, gerar código automaticamente |
| Frequência de uso | Diária (2-5 desenvolvimentos por semana) |
| Dispositivo | Desktop (laboratório/ escritório) |

### Persona 3: Mariana (Desenvolvimento Beneficiamento)

| Atributo | Descrição |
|----------|-----------|
| Função | Química Têxtil / Colorista |
| Objetivo | Desenvolver cores, estampas e receitas |
| Dores | Informações inconsistentes sobre o cru, falta de padronização nas receitas |
| Necessidades no sistema | Ver FT do cru, criar receitas parametrizadas, definir roteiros |
| Frequência de uso | Diária (3-7 receitas por semana) |
| Dispositivo | Desktop (laboratório) |

### Persona 4: Roberto (PCP)

| Atributo | Descrição |
|----------|-----------|
| Função | Planejador de Produção |
| Objetivo | Receber solicitações de produção com todas informações necessárias |
| Dores | Informações incompletas, tem que buscar dados em emails, retrabalho de digitação |
| Necessidades no sistema | Visualizar FT completa, roteiro, receitas, gerar relatório para OP |
| Frequência de uso | Diária |
| Dispositivo | Desktop (escritório) |

### Persona 5: Administrador

| Atributo | Descrição |
|----------|-----------|
| Função | TI / Gestor de Sistema |
| Objetivo | Manter cadastros, gerenciar usuários, monitorar sistema |
| Necessidades no sistema | CRUD completo de todos cadastros, logs de auditoria |
| Frequência de uso | Semanal |
| Dispositivo | Desktop |

---

# 2. ARQUITETURA E TECNOLOGIA

## 2.1 Stack Tecnológico Definido

| Camada | Tecnologia | Versão | Motivo da Escolha |
|--------|------------|--------|-------------------|
| **Frontend/Backend** | Next.js | 14.2+ | App Router, API routes integradas, SSR/SSG |
| **Linguagem** | TypeScript | 5.3+ | Tipagem estática, segurança, produtividade |
| **UI** | React | 18.2+ | Biblioteca principal |
| **Estilização** | Tailwind CSS | 3.4+ | Utilidade, mobile-first, produtividade |
| **Componentes UI** | shadcn/ui | Latest | Componentes acessíveis, personalizáveis |
| **Formulários** | react-hook-form | 7.49+ | Performance, integração com Zod |
| **Validação** | Zod | 3.22+ | Validação tipada |
| **Estado Global** | TanStack Query | 5.17+ | Cache, sincronização server/client |
| **Tabelas** | TanStack Table | 8.11+ | Tabelas poderosas e flexíveis |
| **Drag & Drop** | dnd-kit | 6.1+ | Kanban, sortable lists |
| **Gráficos** | Recharts | 2.10+ | Dashboard, KPIs |
| **Autenticação** | NextAuth.js | 4.24+ | Integração nativa com Next.js |
| **ORM** | Drizzle ORM | 0.29+ | TypeScript-first, migrations simples |
| **Banco de Dados** | PostgreSQL (Neon) | Latest | Serverless, branching, escala automática |
| **Storage (Arquivos)** | Vercel Blob | Latest | Integração nativa, CDN |
| **Hospedagem** | Vercel | - | Deploy automático, edge functions |
| **Cache/Rate Limit** | Upstash Redis | Latest | Serverless, baixa latência |
| **Emails** | Resend | Latest | API simples, entregabilidade |
| **Monitoramento** | Sentry | Latest | Erros, performance |

## 2.2 Arquitetura de Pastas (Estrutura Final)

```
pdmtextil/                               # Pasta raiz do projeto
│
├── src/
│   ├── app/
│   │   ├── (auth)/                      # Grupo de rotas autenticadas
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                 # Grupo de rotas do dashboard
│   │   │   ├── layout.tsx               # Layout com sidebar + header
│   │   │   ├── page.tsx                 # Dashboard principal
│   │   │   │
│   │   │   ├── comercial/               # Módulo Comercial
│   │   │   │   ├── solicitacoes/
│   │   │   │   │   ├── nova/
│   │   │   │   │   │   └── page.tsx    # Nova solicitação (MVP)
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx    # Detalhe da solicitação
│   │   │   │   │   ├── page.tsx         # Lista de solicitações
│   │   │   │   │   └── kanban/
│   │   │   │   │       └── page.tsx     # Kanban por status
│   │   │   │   └── clientes/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── tecelagem/               # Módulo Tecelagem
│   │   │   │   ├── solicitacoes/
│   │   │   │   │   ├── page.tsx         # Solicitações recebidas
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── produtos-cru/
│   │   │   │   │   ├── novo/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── dashboard/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── beneficiamento/          # Módulo Beneficiamento
│   │   │   │   ├── solicitacoes/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── produtos/
│   │   │   │   │   ├── novo/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── receitas/
│   │   │   │   │   ├── tinturaria/
│   │   │   │   │   │   ├── nova/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── termofixacao/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── estamparia/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── roteiros/
│   │   │   │       ├── novo/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── [id]/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── pcp/                     # Módulo PCP
│   │   │   │   ├── solicitacoes/
│   │   │   │   │   ├── amostras/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── producao/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── ops/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── cadastros/               # Módulo Administrativo
│   │   │   │   ├── fios/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── bases-urdume/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── cores/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── estampas/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── acabamentos/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── quimicos/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── maquinas/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── operacoes/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── usuarios/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── relatorios/             # Relatórios
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                         # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── solicitacoes/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── status/
│   │   │   │   │       └── route.ts
│   │   │   │   └── meus/
│   │   │   │       └── route.ts
│   │   │   ├── produtos-cru/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── produtos-beneficiados/
│   │   │   │   └── route.ts
│   │   │   ├── receitas/
│   │   │   │   ├── tinturaria/
│   │   │   │   │   └── route.ts
│   │   │   │   └── estamparia/
│   │   │   │       └── route.ts
│   │   │   ├── roteiros/
│   │   │   │   └── route.ts
│   │   │   ├── cadastros/
│   │   │   │   ├── fios/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── bases-urdume/
│   │   │   │   │   └── route.ts
│   │   │   │   └── cores/
│   │   │   │       └── route.ts
│   │   │   ├── upload/
│   │   │   │   └── route.ts
│   │   │   └── webhooks/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui componentes base
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── skeleton.tsx
│   │   │
│   │   ├── forms/                       # Formulários customizados
│   │   │   ├── BriefingTecelagemForm.tsx
│   │   │   ├── BriefingBeneficiamentoForm.tsx
│   │   │   ├── AnexosUpload.tsx
│   │   │   ├── ReceitaTinturariaForm.tsx
│   │   │   ├── ReceitaEstampariaForm.tsx
│   │   │   ├── RoteiroProducaoForm.tsx
│   │   │   ├── ProdutoCruForm.tsx
│   │   │   ├── ProdutoBeneficiadoForm.tsx
│   │   │   └── FormModal.tsx
│   │   │
│   │   ├── tables/                      # Tabelas
│   │   │   ├── DataTable.tsx
│   │   │   ├── SolicitacoesTable.tsx
│   │   │   ├── ProdutosTable.tsx
│   │   │   └── ColumnDefs/
│   │   │       ├── solicitacoesColumns.tsx
│   │   │       ├── produtosCruColumns.tsx
│   │   │       └── produtosBeneficiadosColumns.tsx
│   │   │
│   │   ├── kanban/                      # Kanban
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanCard.tsx
│   │   │
│   │   ├── charts/                      # Gráficos
│   │   │   ├── DashboardCharts.tsx
│   │   │   ├── StatusPieChart.tsx
│   │   │   └── TimelineChart.tsx
│   │   │
│   │   ├── layout/                      # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileBottomNav.tsx
│   │   │   └── Breadcrumb.tsx
│   │   │
│   │   └── shared/                      # Componentes compartilhados
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       ├── StatusBadge.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── index.ts
│   │   │   │   ├── solicitacoes.ts
│   │   │   │   ├── anexos.ts
│   │   │   │   ├── produtosCru.ts
│   │   │   │   ├── produtosBeneficiados.ts
│   │   │   │   ├── receitas.ts
│   │   │   │   ├── roteiros.ts
│   │   │   │   ├── cadastros.ts
│   │   │   │   └── usuarios.ts
│   │   │   ├── index.ts
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   │
│   │   ├── auth.ts                      # NextAuth config
│   │   ├── api.ts                       # API client
│   │   ├── utils/
│   │   │   ├── codigos.ts               # Gerador de códigos Systêxtil
│   │   │   ├── formatters.ts            # Formatadores (data, moeda)
│   │   │   ├── validators.ts            # Funções de validação
│   │   │   └── constants.ts             # Constantes do sistema
│   │   │
│   │   └── hooks/
│   │       ├── useSolicitacoes.ts
│   │       ├── useProdutos.ts
│   │       ├── useReceitas.ts
│   │       ├── useAuth.ts
│   │       └── useToast.ts
│   │
│   ├── types/
│   │   ├── solicitacao.ts
│   │   ├── briefing.ts
│   │   ├── produto.ts
│   │   ├── receita.ts
│   │   ├── roteiro.ts
│   │   └── next-auth.d.ts
│   │
│   └── middleware.ts
│
├── public/
│   ├── favicon.ico
│   └── logo.png
│
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
├── .gitignore
├── vercel.json
├── README.md
└── LICENSE
```

## 2.3 Decisões Arquiteturais

### 2.3.1 Por que Next.js App Router?
- Server Components para performance
- API Routes integradas (sem backend separado)
- Suporte nativo a SSR/SSG
- Middleware para autenticação
- Edge Functions para baixa latência

### 2.3.2 Por que Drizzle ORM?
- TypeScript-first com inferência total
- Migrações simples e versionadas
- Performance superior comparado a Prisma
- Suporte a JSONB (essencial para briefings)

### 2.3.3 Por que Neon (PostgreSQL)?
- Serverless - escala automaticamente
- Branching para ambientes de desenvolvimento
- Point-in-time recovery
- Connection pooling
- Gratuito para MVP

### 2.3.4 Por que Vercel?
- Integração nativa com Next.js
- Deploy automático via Git
- Edge Network global
- Vercel Blob para arquivos
- Cron Jobs integrados
- Analytics e Monitoring

### 2.3.5 Padrão de Estado
- **Server State**: React Query (TanStack Query)
  - Cache de dados do servidor
  - Sincronização automática
  - Revalidação em background
- **Client State**: Zustand (apenas para UI efêmera)
  - Estado do modal (aberto/fechado)
  - Filtros temporários
  - Preferências de UI

### 2.3.6 Padrão de API
- RESTful com recursos aninhados
- Zod para validação em runtime
- Erros padronizados (códigos HTTP)
- Rate limiting por IP/usuário

---

# 3. REGRAS DE NEGÓCIO FUNDAMENTAIS

## 3.1 Regras de Solicitação

### Regra 1: Solicitação de Desenvolvimento (MVP)
```
REGRAS:
├── Pode ser criada SEM nenhum pré-cadastro existente
├── Briefing é OBRIGATÓRIO (7 seções)
├── Cliente é OBRIGATÓRIO
├── Anexos são OPCIONAIS
├── Status inicial: "PENDENTE"
├── Notifica automaticamente o departamento responsável
│   ├── Se tipo = DESENVOLVIMENTO_TECELAGEM → notifica TECELAGEM
│   └── Se tipo = DESENVOLVIMENTO_BENEFICIAMENTO → notifica BENEFICIAMENTO
└── Comercial só vê suas próprias solicitações (exceto ADMIN)
```

### Regra 2: Fluxo de Status
```
STATUS PERMITIDOS E TRANSIÇÕES:

RASCUNHO (não usado no MVP, pode ignorar)
    ↓ (salvar e enviar)
PENDENTE
    ↓ (desenvolvimento começa a analisar)
EM_ANALISE
    ↓ (precisa de mais informações do comercial)
AGUARDANDO_INFORMACOES
    ↓ (comercial responde com informações)
EM_ANALISE
    ↓ (desenvolvimento conclui)
CONCLUIDO
```

### Regra 3: Quem pode alterar status
| Perfil | Pode alterar status? | Limitações |
|--------|---------------------|------------|
| COMERCIAL | Sim | Só suas próprias solicitações |
| TECELAGEM | Sim | Só solicitações do tipo DESENVOLVIMENTO_TECELAGEM |
| BENEFICIAMENTO | Sim | Só solicitações do tipo DESENVOLVIMENTO_BENEFICIAMENTO |
| ADMIN | Sim | Todas solicitações |

## 3.2 Regras de Cadastro (Pós-MVP)

### Regra 4: Hierarquia de Produtos
```
NÍVEL 7 (Fios) → PODE EXISTIR SEM NADA
    ↓
NÍVEL 4 (Base de Urdume) → PRECISA de Fios na composição
    ↓
NÍVEL 2 (Produto Cru) → PRECISA de Base de Urdume + Fio Trama
    ↓
NÍVEL 2 (Produto Beneficiado) → PRECISA de Produto Cru
```

### Regra 5: Códigos Automáticos
```
TODO PRODUTO DE NÍVEL 2,4,7,9 TEM CÓDIGO GERADO AUTOMATICAMENTE
├── Formato: NIVEL.GRUPO.SUBGRUPO.ITEM
├── Validação de unicidade no banco
├── Não permite edição manual do código completo
└── Pode sugerir próximo código baseado no grupo
```

### Regra 6: Solicitação de Produção - Tecelagem
```
REQUISITOS PARA CRIAR:
├── Produto Cru EXISTE no sistema
├── Produto Cru tem Ficha Técnica COMPLETA
└── Produto Cru está com status "ATIVO"

CAMPOS OBRIGATÓRIOS:
├── produtoCruId
├── quantidade (metros)
└── dataDesejada
```

### Regra 7: Solicitação de Produção - Beneficiamento
```
REQUISITOS PARA CRIAR:
├── Produto Cru EXISTE e está em ESTOQUE (campo informado manualmente)
├── Produto Beneficiado EXISTE no sistema
├── Produto Beneficiado tem Ficha Técnica COMPLETA
├── Produto Beneficiado tem RECEITA (conforme tipo)
└── Produto Beneficiado está com status "ATIVO"

CAMPOS OBRIGATÓRIOS:
├── produtoCruId
├── produtoBeneficiadoId
├── quantidade (metros)
└── dataDesejada
```

### Regra 8: Aprovação de Ficha Técnica
```
FLUXO DE APROVAÇÃO:
├── Desenvolvimento marca FT como "AGUARDANDO_APROVACAO"
├── Sistema notifica Comercial
├── Comercial visualiza FT completa
├── Comercial pode:
│   ├── APROVAR → FT vira "APROVADA"
│   └── REJEITAR → FT volta para "RASCUNHO" com justificativa
└── Aprovação fica registrada (quem, quando, comentário)
```

## 3.3 Regras de Briefing (Obrigatórias no MVP)

### Seção 1: Uso Final - Campos Obrigatórios
- tipoUniforme (seleção única)
- ambiente.interno ou externo (pelo menos um)
- ambiente.temperatura
- ambiente.abrasao

### Seção 2: Performance - Pelo menos 3 itens marcados
- respirável
- secagemRapida
- antiodor
- antibacteriano
- antiPilling
- altaResistenciaAbrasao
- elasticidade

### Seção 3: Gramatura - Obrigatório
- faixa (LEVE/MEDIO/PESADO)

### Seção 4: Toque - Obrigatório
- tipo (TECNICO_SECO/MACIO_CONFORTO/ESTRUTURADO)

### Seção 5: Visual - Obrigatório
- acabamento
- estilo

### Seção 6: Composição - Obrigatório
- urdume (texto livre)
- trama (texto livre)
- elastano (booleano)

### Seção 7: Cores - Obrigatório
- tipo (SOLIDAS/DESENVOLVIMENTO_EXCLUSIVO)

### Seção 8: Preço - Obrigatório
- posicionamentoPreco

---

# 4. ESTRUTURA DE CÓDIGOS SYSTÊXTIL

## 4.1 Formato Geral

```
NIVEL.GRUPO.SUBGRUPO.ITEM

ONDE:
├── NIVEL: 1 dígito (2, 4, 7, 9)
├── GRUPO: 5 caracteres alfanuméricos
├── SUBGRUPO: 3 caracteres alfanuméricos
└── ITEM: 6 caracteres alfanuméricos

EXEMPLO: 2.K1820.CRU.000CRU
```

## 4.2 Tabela de Níveis

| Nível | Descrição | Exemplo de Código |
|-------|-----------|-------------------|
| 2 | Tecido (cru ou acabado) | `2.K1820.CRU.000CRU` |
| 4 | Base de Urdume (rolo) | `4.UR001.CRU.000001` |
| 7 | Fios | `7.AL20.XXX.000001` |
| 9 | Produtos Químicos / Insumos | `9.COR001.XXX.000001` |

## 4.3 Regras por Tipo de Produto (Nível 2)

| Tipo | Subgrupo | Item | Exemplo |
|------|----------|------|---------|
| Cru | `CRU` | `000CRU` | `2.K1820.CRU.000CRU` |
| Termofixado | `TER` | `000001` | `2.K1820.TER.000001` |
| Tingido | `TIN` | Código cor (6 dígitos) | `2.K1820.TIN.000001` |
| Alvejado | `001` | `000001` | `2.K1820.001.000001` |
| Estampado | Código cor fundo (3 dígitos) | Desenho (4) + Variante (2) | `2.K1820.001.500101` |

## 4.4 Significado dos Exemplos

```
2.K1820.CRU.000CRU
│ │     │   └── Item: 000CRU (indica que é cru)
│ │     └────── Subgrupo: CRU (situação do produto)
│ └──────────── Grupo: K1820 (identificador do tecido)
└─────────────── Nível: 2 (tecido)

DECODIFICANDO GRUPO K1820:
├── K = largura 2,50m
├── 18 = 18 batidas por centímetro quadrado
└── 20 = fio 20/1 na trama

2.K1820.TIN.000001 (Tecido Tingido Azul Marinho)
├── Subgrupo: TIN (tingido)
└── Item: 000001 (código da cor)

2.K1820.001.500101 (Tecido Estampado Fundo Branco)
├── Subgrupo: 001 (código da cor de fundo = branco)
└── Item: 500101 (desenho 5001 + variante 01)
```

## 4.5 Regras de Geração Automática

```
AO CRIAR PRODUTO CRU:
├── Nível = 2
├── Grupo = informado pelo usuário (5 caracteres)
├── Subgrupo = "CRU"
├── Item = "000CRU"
└── Código completo = "2.{GRUPO}.CRU.000CRU"

AO CRIAR PRODUTO TINGIDO:
├── Nível = 2
├── Grupo = herdado do produto cru
├── Subgrupo = "TIN"
├── Item = código da cor (6 dígitos)
└── Código completo = "2.{GRUPO}.TIN.{CODIGO_COR}"

AO CRIAR PRODUTO ESTAMPADO:
├── Nível = 2
├── Grupo = herdado do produto cru
├── Subgrupo = código da cor de fundo (3 dígitos)
├── Item = desenho(4) + variante(2)
└── Código completo = "2.{GRUPO}.{COR_FUNDO}.{DESENHO}{VARIANTE}"

AO CRIAR BASE DE URDUME:
├── Nível = 4
├── Grupo = código da base (até 5 caracteres)
├── Subgrupo = "CRU"
├── Item = "000001" (incrementa automaticamente)
└── Código completo = "4.{CODIGO_BASE}.CRU.000001"

AO CRIAR FIO:
├── Nível = 7
├── Grupo = código do fio (até 5 caracteres)
├── Subgrupo = "XXX"
├── Item = "000001" (incrementa automaticamente)
└── Código completo = "7.{CODIGO_FIO}.XXX.000001"
```

---

# 5. MODELO DE DADOS (BANCO DE DADOS)

## 5.1 Diagrama de Relacionamentos (Conceitual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS                                        │
│  id (PK) | email | name | role | password | ativo                           │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ 1:N
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOLICITACOES                                       │
│  id (PK) | tipo | status | solicitanteId (FK) | cliente | cnpj | projeto    │
│  briefing (JSONB) | observacoes | historicoComunicacao (JSONB)              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ 1:N
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               ANEXOS                                         │
│  id (PK) | solicitacaoId (FK) | tipo | titulo | url | metadados (JSONB)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pós-MVP - Relacionamentos Adicionais

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      FIOS        │     │   BASES_URDUME   │     │  PRODUTOS_CRU    │
│  id (PK)         │────▶│  id (PK)         │────▶│  id (PK)         │
│  codigoCompleto  │     │  codigoCompleto  │     │  codigoCompleto  │
│  codigoFio       │     │  codigoBase      │     │  grupo           │
│  nome            │     │  nome            │     │  baseUrdumeId(FK)│
│  composicao      │     │  composicaoFios  │     │  fioTramaId(FK)  │
│  titulo          │     │  densidade       │     │  ligamento       │
│  fornecedor      │     │  tratamento      │     │  gramatura       │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                            │
                                                            │ 1:N
                                                            ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  PRODUTOS_QUI    │     │     CORES        │     │PRODUTOS_BENEF    │
│  id (PK)         │     │  id (PK)         │     │  id (PK)         │
│  codigoCompleto  │     │  codigo (3 ou 6) │     │  codigoCompleto  │
│  tipo            │     │  nome            │     │  produtoCruId(FK)│
│  fornecedor      │     │  pantone         │     │  tipoBeneficiamento│
└────────┬─────────┘     └──────────────────┘     │  corId(FK)       │
         │                                         │  estampaId(FK)   │
         │ 1:N                                     └────────┬─────────┘
         ▼                                                  │
┌──────────────────────────────────────────────────────────┐│
│                    RECEITAS_TINTURARIA                    ││
│  id (PK) | codigo | produtoBeneficiadoId (FK)             ││
│  produtosQuimicos (JSONB) | curvaTingimento (JSONB)       ││
│  temperatura | tempo | pH | relacaoBanho                  ││
└───────────────────────────────────────────────────────────┘│
                                                              │
┌──────────────────────────────────────────────────────────┐│
│                    ROTEIROS_PRODUCAO                      ││
│  id (PK) | produtoBeneficiadoId (FK) | nome               ││
└─────────────────────────┬────────────────────────────────┘│
                          │                                  │
                          │ 1:N                              │
                          ▼                                  │
┌──────────────────────────────────────────────────────────┐│
│                    ETAPAS_ROTEIRO                         ││
│  id (PK) | roteiroId (FK) | ordem | operacaoId (FK)       ││
│  maquinaId (FK) | parametros (JSONB) | instrucoes         ││
└───────────────────────────────────────────────────────────┘│
```

## 5.2 Tabelas Detalhadas (MVP)

### Tabela: usuarios

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| email | VARCHAR(255) | Sim | Email do usuário (único) |
| password | VARCHAR(255) | Sim | Hash da senha |
| name | VARCHAR(255) | Sim | Nome completo |
| role | VARCHAR(50) | Sim | Perfil (COMERCIAL/TECELAGEM/BENEFICIAMENTO/ADMIN) |
| ativo | BOOLEAN | Sim | Usuário ativo? |
| ultimoAcesso | TIMESTAMP | Não | Último login |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: solicitacoes

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| tipo | VARCHAR(30) | Sim | DESENVOLVIMENTO_TECELAGEM / DESENVOLVIMENTO_BENEFICIAMENTO |
| status | VARCHAR(30) | Sim | RASCUNHO/PENDENTE/EM_ANALISE/AGUARDANDO_INFORMACOES/CONCLUIDO |
| solicitanteId | INTEGER (FK) | Sim | Quem criou a solicitação |
| responsavelId | INTEGER (FK) | Não | Quem está analisando |
| cliente | VARCHAR(200) | Sim | Nome do cliente |
| cnpj | VARCHAR(18) | Não | CNPJ do cliente |
| projeto | VARCHAR(200) | Não | Nome do projeto/coleção |
| briefing | JSONB | Sim | Briefing completo (7 seções) |
| historicoComunicacao | JSONB | Não | Array de eventos |
| observacoes | TEXT | Não | Observações gerais |
| prazoDesejado | TIMESTAMP | Não | Data desejada pelo cliente |
| dataConclusao | TIMESTAMP | Não | Data de conclusão |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: anexos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| solicitacaoId | INTEGER (FK) | Sim | Solicitação relacionada |
| tipo | VARCHAR(20) | Sim | LINK/ARQUIVO/GOOGLE_SHEETS/YOUTUBE/GOOGLE_AGENDA |
| titulo | VARCHAR(200) | Sim | Título descritivo |
| url | TEXT | Sim | URL do recurso |
| metadados | JSONB | Não | Metadados específicos |
| nomeArquivo | VARCHAR(255) | Não | Nome original do arquivo |
| tamanho | INTEGER | Não | Tamanho em bytes |
| mimeType | VARCHAR(100) | Não | Tipo MIME |
| criadoPor | INTEGER (FK) | Sim | Quem anexou |
| createdAt | TIMESTAMP | Sim | Data do anexo |

## 5.3 Tabelas Detalhadas (Pós-MVP - Cadastros)

### Tabela: fios (Nível 7)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigoCompleto | VARCHAR(30) | Sim | Código no formato Systêxtil (único) |
| codigoFio | VARCHAR(10) | Sim | Código curto (ex: AL20) único |
| nome | VARCHAR(200) | Sim | Nome do fio |
| nomeComercial | VARCHAR(200) | Não | Nome comercial |
| composicao | VARCHAR(200) | Não | Ex: 100% Algodão |
| titulo | VARCHAR(20) | Não | Título (20/1, 30/1, 150D) |
| torcao | VARCHAR(20) | Não | Tipo de torção (Z, S) |
| resistencia | DECIMAL | Não | Resistência à tração (kgf) |
| alongamento | DECIMAL | Não | Alongamento na ruptura (%) |
| fornecedor | VARCHAR(200) | Não | Nome do fornecedor |
| observacoes | TEXT | Não | Observações |
| ativo | BOOLEAN | Sim | Status |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: bases_urdume (Nível 4)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigoCompleto | VARCHAR(30) | Sim | Código no formato Systêxtil (único) |
| codigoBase | VARCHAR(10) | Sim | Código curto (ex: UR001) único |
| nome | VARCHAR(200) | Sim | Nome da base |
| descricao | TEXT | Não | Descrição |
| composicaoFios | JSONB | Sim | Lista de fios com quantidades |
| densidade | DECIMAL | Não | Densidade (fios/cm) |
| tratamentoEncolagem | TEXT | Não | Tipo de tratamento |
| tensaoUrdume | DECIMAL | Não | Tensão (kg) |
| observacoes | TEXT | Não | Observações |
| ativo | BOOLEAN | Sim | Status |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: produtos_cru (Nível 2)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigoCompleto | VARCHAR(30) | Sim | Código no formato Systêxtil (único) |
| grupo | VARCHAR(5) | Sim | Identificador do tecido |
| larguraNominal | DECIMAL | Não | Largura em metros |
| batidasPorCm2 | INTEGER | Não | Batidas por cm² |
| fioTramaReferencia | VARCHAR(20) | Não | Referência do fio |
| ligamento | VARCHAR(50) | Não | Tipo de ligamento |
| gramatura | DECIMAL | Não | Gramatura (g/m²) |
| densidadeUrdume | DECIMAL | Não | Densidade urdume (fios/cm) |
| densidadeTrama | DECIMAL | Não | Densidade trama (fios/cm) |
| encolhimentoResidual | DECIMAL | Não | Encolhimento (%) |
| resistenciaTracao | DECIMAL | Não | Resistência à tração |
| resistenciaRasgo | DECIMAL | Não | Resistência ao rasgo |
| baseUrdumeId | INTEGER (FK) | Não | Base de urdume utilizada |
| fioTramaId | INTEGER (FK) | Não | Fio da trama |
| observacoes | TEXT | Não | Observações |
| status | VARCHAR(20) | Sim | ATIVO/INATIVO/RASCUNHO/APROVADO |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| aprovadoPor | INTEGER (FK) | Não | Usuário que aprovou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: cores_solidas

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigo | VARCHAR(6) | Sim | Código de 6 dígitos (único) |
| nome | VARCHAR(100) | Sim | Nome da cor |
| pantone | VARCHAR(20) | Não | Referência Pantone |
| familia | VARCHAR(50) | Não | Família (AZUL, VERMELHO) |
| ativo | BOOLEAN | Sim | Status |

### Tabela: cores_fundo

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigo | VARCHAR(3) | Sim | Código de 3 dígitos (único) |
| nome | VARCHAR(100) | Sim | Nome da cor |
| descricao | TEXT | Não | Descrição |
| ativo | BOOLEAN | Sim | Status |

### Tabela: estampas

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigoDesenho | VARCHAR(4) | Sim | Código do desenho (4 dígitos) |
| variante | VARCHAR(2) | Sim | Variante (2 dígitos) |
| nome | VARCHAR(200) | Sim | Nome da estampa |
| tipo | VARCHAR(50) | Não | FLORAL/LISTRADO/POA/GEOMETRICO |
| imagemUrl | VARCHAR(500) | Não | URL da imagem de referência |
| ativo | BOOLEAN | Sim | Status |

### Tabela: acabamentos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| nome | VARCHAR(100) | Sim | Nome do acabamento |
| descricao | TEXT | Não | Descrição |
| categoria | VARCHAR(50) | Não | MECANICO/QUIMICO/TERMICO |
| ativo | BOOLEAN | Sim | Status |

### Tabela: produtos_quimicos (Nível 9)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigoCompleto | VARCHAR(30) | Sim | Código no formato Systêxtil |
| codigoQuimico | VARCHAR(20) | Sim | Código curto |
| nome | VARCHAR(200) | Sim | Nome do produto |
| tipo | VARCHAR(50) | Não | CORANTE/AUXILIAR/RESINA/SAL/ACIDO |
| fornecedor | VARCHAR(200) | Não | Nome do fornecedor |
| concentracao | DECIMAL | Não | Concentração (%) |
| formaFisica | VARCHAR(20) | Não | LIQUIDO/PO/PASTA |
| unidadePadrao | VARCHAR(10) | Não | g/L/%/g/kg |
| fispq | TEXT | Não | URL da ficha de segurança |
| ativo | BOOLEAN | Sim | Status |

## 5.4 Tabelas Detalhadas (Pós-MVP - Produtos e Receitas)

### Tabela: produtos_beneficiados (Nível 2)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigoCompleto | VARCHAR(30) | Sim | Código no formato Systêxtil |
| produtoCruId | INTEGER (FK) | Sim | Produto cru de origem |
| tipoBeneficiamento | VARCHAR(20) | Sim | TERMOFIXADO/TINGIDO/ESTAMPADO/ALVEJADO |
| corSolidaId | INTEGER (FK) | Não | Para tingidos |
| corFundoId | INTEGER (FK) | Não | Para estampados |
| estampaId | INTEGER (FK) | Não | Para estampados |
| acabamentos | JSONB | Não | Lista de acabamentos aplicados |
| gramaturaFinal | DECIMAL | Não | Gramatura após beneficiamento |
| larguraFinal | DECIMAL | Não | Largura após beneficiamento |
| encolhimento | DECIMAL | Não | Encolhimento (%) |
| solidezCor | VARCHAR(50) | Não | Grau de solidez |
| status | VARCHAR(20) | Sim | ATIVO/INATIVO/RASCUNHO/APROVADO |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| aprovadoPor | INTEGER (FK) | Não | Usuário que aprovou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: receitas_tinturaria

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigo | VARCHAR(30) | Sim | Código da receita (único) |
| nome | VARCHAR(200) | Sim | Nome da receita |
| produtoBeneficiadoId | INTEGER (FK) | Sim | Produto associado |
| tipo | VARCHAR(20) | Sim | TINGIMENTO/ALVEJAMENTO |
| maquinaRecomendada | VARCHAR(50) | Não | JIGGER/TURBO/EXAUSTOR |
| temperatura | INTEGER | Não | Temperatura máxima (°C) |
| tempo | INTEGER | Não | Tempo total (min) |
| pH | DECIMAL | Não | pH do banho |
| relacaoBanho | DECIMAL | Não | Relação banho:tecido |
| velocidade | DECIMAL | Não | Velocidade (m/min) |
| produtosQuimicos | JSONB | Sim | Lista de produtos com quantidades |
| curvaTingimento | JSONB | Não | Curva de temperatura x tempo |
| observacoes | TEXT | Não | Observações |
| versao | INTEGER | Sim | Número da versão |
| status | VARCHAR(20) | Sim | ATIVO/RASCUNHO/OBSOLETO |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| aprovadoPor | INTEGER (FK) | Não | Usuário que aprovou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: receitas_estamparia

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigo | VARCHAR(30) | Sim | Código da receita (único) |
| nome | VARCHAR(200) | Sim | Nome da receita |
| produtoBeneficiadoId | INTEGER (FK) | Sim | Produto associado |
| estampaId | INTEGER (FK) | Sim | Estampa associada |
| maquinaEstamparia | VARCHAR(50) | Não | ROTATIVA/PLANA/DIGITAL/SERIGRAFIA |
| velocidade | DECIMAL | Não | Velocidade (m/min) |
| pressaoRodo | DECIMAL | Não | Pressão do rodo (kg/cm²) |
| anguloRodo | INTEGER | Não | Ângulo do rodo (graus) |
| coresEstampa | JSONB | Sim | Lista de cores da estampa |
| pastasCor | JSONB | Não | Formulação das pastas de cor |
| tipoFixacao | VARCHAR(30) | Não | VAPOR/SECAGEM/UV |
| temperaturaFixacao | INTEGER | Não | Temperatura de fixação (°C) |
| tempoFixacao | INTEGER | Não | Tempo de fixação (seg) |
| observacoes | TEXT | Não | Observações |
| versao | INTEGER | Sim | Número da versão |
| status | VARCHAR(20) | Sim | ATIVO/RASCUNHO/OBSOLETO |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| aprovadoPor | INTEGER (FK) | Não | Usuário que aprovou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: roteiros_producao

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| nome | VARCHAR(200) | Sim | Nome do roteiro |
| produtoBeneficiadoId | INTEGER (FK) | Sim | Produto associado |
| status | VARCHAR(20) | Sim | ATIVO/RASCUNHO/OBSOLETO |
| observacoes | TEXT | Não | Observações |
| criadoPor | INTEGER (FK) | Sim | Usuário que criou |
| aprovadoPor | INTEGER (FK) | Não | Usuário que aprovou |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: etapas_roteiro

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| roteiroId | INTEGER (FK) | Sim | Roteiro associado |
| ordem | INTEGER | Sim | Ordem na sequência (1,2,3...) |
| operacaoId | INTEGER (FK) | Sim | Operação (PREPARAR/TINGIR/SECAR...) |
| maquinaId | INTEGER (FK) | Não | Máquina específica |
| parametros | JSONB | Não | Parâmetros da operação |
| tempoSetup | INTEGER | Não | Tempo de setup (min) |
| tempoProcessamento | DECIMAL | Não | Tempo por unidade (min/m) |
| instrucoes | TEXT | Não | Instruções específicas |
| opcional | BOOLEAN | Sim | Etapa opcional? |
| createdAt | TIMESTAMP | Sim | Data de criação |
| updatedAt | TIMESTAMP | Sim | Data de atualização |

### Tabela: maquinas

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigo | VARCHAR(30) | Sim | Código da máquina (único) |
| nome | VARCHAR(100) | Sim | Nome da máquina |
| tipo | VARCHAR(50) | Não | Tipo (ENROLADEIRA/JIGGER/RAMA) |
| velocidadeMaxima | DECIMAL | Não | Velocidade máxima (m/min) |
| capacidadeCarga | DECIMAL | Não | Capacidade (kg/m) |
| disponivel | BOOLEAN | Sim | Disponível para uso? |
| ativo | BOOLEAN | Sim | Status |

### Tabela: operacoes

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL (PK) | Sim | Identificador único |
| codigo | VARCHAR(20) | Sim | Código da operação (único) |
| nome | VARCHAR(100) | Sim | Nome da operação |
| descricao | TEXT | Não | Descrição |
| categoria | VARCHAR(50) | Não | PREPARACAO/BENEFICIAMENTO/ACABAMENTO/INSPECAO |
| unidadeMedida | VARCHAR(10) | Não | metros/kg/horas |
| ativo | BOOLEAN | Sim | Status |

---

# 6. FLUXOS DE TRABALHO COMPLETOS

## 6.1 Fluxo MVP - Solicitação de Desenvolvimento

### Fluxo Detalhado - Comercial

```
PASSO 1: ACESSAR TELA DE NOVA SOLICITAÇÃO
├── URL: /comercial/solicitacoes/nova
├── Ação: Comercial clica em "Nova Solicitação"
└── Resultado: Exibe formulário de briefing

PASSO 2: SELECIONAR TIPO DE SOLICITAÇÃO
├── Campo: tipo (DESENVOLVIMENTO_TECELAGEM ou DESENVOLVIMENTO_BENEFICIAMENTO)
├── Default: DESENVOLVIMENTO_TECELAGEM
└── Resultado: Exibe campos específicos do tipo

PASSO 3: PREENCHER DADOS COMERCIAIS
├── Cliente * (obrigatório)
├── CNPJ (opcional)
├── Projeto/Coleção (opcional)
└── Prazo Desejado (opcional)

PASSO 4: PREENCHER BRIEFING TÉCNICO
├── Seção 1: Uso Final
├── Seção 2: Performance
├── Seção 3: Gramatura
├── Seção 4: Toque
├── Seção 5: Visual
├── Seção 6: Composição
├── Seção 7: Cores
└── Seção 8: Posicionamento de Preço

PASSO 5: ANEXAR ARQUIVOS E LINKS
├── Arraste arquivos ou clique para selecionar
├── Ou adicione links (YouTube, Google Sheets, etc)
└── Limite: 10MB por arquivo

PASSO 6: ENVIAR SOLICITAÇÃO
├── Validação: todos campos obrigatórios preenchidos
├── Ação: clica em "Enviar Solicitação"
├── Sistema: cria registro no banco com status "PENDENTE"
├── Sistema: envia notificação para departamento responsável
└── Redireciona para lista de solicitações
```

### Fluxo Detalhado - Desenvolvimento (Tecelagem/Beneficiamento)

```
PASSO 1: ACESSAR LISTA DE SOLICITAÇÕES
├── URL: /tecelagem/solicitacoes (ou /beneficiamento/solicitacoes)
├── Filtros: PENDENTE, EM_ANALISE, AGUARDANDO_INFO
└── Visualização: cards ou tabela

PASSO 2: ABRIR SOLICITAÇÃO
├── Clique na solicitação desejada
├── Visualiza:
│   ├── Dados comerciais
│   ├── Briefing completo
│   └── Anexos (arquivos e links)
└── Opções na tela de detalhe

PASSO 3: ATUALIZAR STATUS
├── Opção 1: "Iniciar Análise" → muda status para EM_ANALISE
├── Opção 2: "Solicitar Mais Informações" → muda para AGUARDANDO_INFORMACOES
│   └── Obrigatório: escrever mensagem para comercial
├── Opção 3: "Concluir Análise" → muda para CONCLUIDO
└── Opção 4: "Adicionar Observação" → registra no histórico

PASSO 4: REGISTRAR COMUNICAÇÃO
├── Campo: "Adicionar comentário"
├── Visível para: comercial e desenvolvimento
└── Salva no histórico com timestamp e autor
```

## 6.2 Fluxo Pós-MVP - Desenvolvimento de Produto Cru

```
PASSO 1: TECELAGEM RECEBE SOLICITAÇÃO APROVADA
├── Solicitação com status "PENDENTE" ou "EM_ANALISE"
├── Briefing já analisado
└── Decisão: desenvolver o produto

PASSO 2: CRIAR CADASTROS BASE (se necessário)
├── Verificar se fios existem
│   ├── Se não: cadastrar fios (Nível 7)
│   └── Se sim: selecionar existente
├── Verificar se base de urdume existe
│   ├── Se não: cadastrar base (Nível 4)
│   └── Se sim: selecionar existente

PASSO 3: CRIAR PRODUTO CRU
├── Acessar: /tecelagem/produtos-cru/novo
├── Informar:
│   ├── Grupo (5 caracteres, ex: K1820)
│   ├── Base de Urdume (selecionar)
│   ├── Fio da Trama (selecionar)
│   ├── Ligamento
│   ├── Gramatura
│   ├── Densidades
│   └── Outras especificações
├── Sistema: gera código automaticamente
├── Status inicial: RASCUNHO
└── Salvar

PASSO 4: PREENCHER FICHA TÉCNICA COMPLETA
├── Especificações técnicas do cru
├── Resultados de testes (se disponíveis)
├── Observações
└── Status muda para "AGUARDANDO_APROVACAO"

PASSO 5: COMERCIAL APROVA FT DO CRU
├── Notificado automaticamente
├── Visualiza FT completa
├── Opções:
│   ├── Aprovar → FT vira "APROVADA"
│   └── Rejeitar → volta para "RASCUNHO" com justificativa
└── Registro de aprovação salvo

PASSO 6: PRODUTO APROVADO
├── Disponível para solicitações de produção
└── Disponível como base para beneficiamento
```

## 6.3 Fluxo Pós-MVP - Desenvolvimento de Produto Beneficiado

```
PASSO 1: BENEFICIAMENTO RECEBE SOLICITAÇÃO
├── Baseado em produto cru já desenvolvido
├── Briefing específico de cor/estampa
└── Decisão: desenvolver

PASSO 2: CRIAR PRODUTO BENEFICIADO
├── Acessar: /beneficiamento/produtos/novo
├── Selecionar produto cru base
├── Selecionar tipo: TINGIDO/ESTAMPADO/TERMOFIXADO
├── Para TINGIDO:
│   ├── Selecionar cor sólida
│   └── (ou criar nova cor)
├── Para ESTAMPADO:
│   ├── Selecionar cor de fundo
│   ├── Selecionar estampa
│   └── (ou criar nova estampa)
├── Definir acabamentos (múltipla escolha)
└── Sistema: gera código automaticamente

PASSO 3: CRIAR RECEITA (conforme tipo)
├── Para TINGIDO: Receita de Tinturaria
│   ├── Produtos químicos e quantidades
│   ├── Curva de tingimento
│   ├── Parâmetros (temp, tempo, pH)
│   └── Validação de receita
├── Para ESTAMPADO: Receita de Estamparia
│   ├── Cores da estampa
│   ├── Pastas de cor (formulação)
│   ├── Parâmetros de máquina
│   └── Fixação
└── Para TERMOFIXADO: Receita de Termofixação
    ├── Temperatura por zona
    ├── Velocidade e overfeed
    └── Encolhimento esperado

PASSO 4: CRIAR ROTEIRO DE PRODUÇÃO
├── Sequência de operações (PREPARAR → TINGIR → SECAR → ACABAR)
├── Atribuir máquinas por etapa
├── Definir parâmetros por etapa
└── Tempos padrão (setup + processamento)

PASSO 5: APROVAÇÃO COMERCIAL
├── FT completa do beneficiado
├── Receitas anexadas
├── Roteiro anexado
└── Comercial aprova ou rejeita

PASSO 6: PRODUTO APROVADO
├── Disponível para solicitações de produção
└── Pode ser referenciado em OPs
```

## 6.4 Fluxo Pós-MVP - Solicitação de Produção

### Produção de Tecelagem (só cru)

```
PASSO 1: COMERCIAL ACESSA "NOVA PRODUÇÃO - TECELAGEM"
├── URL: /comercial/solicitacoes/producao/tecelagem
└── Precisa de produto cru aprovado

PASSO 2: PREENCHER DADOS
├── Selecionar Produto Cru (apenas APROVADOS)
├── Quantidade (metros) * obrigatório
├── Data Desejada * obrigatório
├── Observações (opcional)
└── Anexos (opcional)

PASSO 3: ENVIAR SOLICITAÇÃO
├── Status inicial: PENDENTE
├── Notifica PCP
└── Solicitação vinculada ao produto cru

PASSO 4: PCP RECEBE A SOLICITAÇÃO
├── Visualiza FT do cru
├── Verifica disponibilidade de máquinas
├── Planeja produção
└── Registra número da OP (campo manual)
```

### Produção de Beneficiamento (cru + beneficiado)

```
PASSO 1: COMERCIAL ACESSA "NOVA PRODUÇÃO - BENEFICIAMENTO"
├── URL: /comercial/solicitacoes/producao/beneficiamento
├── Precisa de cru APROVADO e em estoque
└── Precisa de beneficiado APROVADO

PASSO 2: PREENCHER DADOS
├── Selecionar Produto Cru (estoque disponível)
├── Selecionar Produto Beneficiado (baseado no cru)
├── Quantidade (metros) * obrigatório
├── Data Desejada * obrigatório
└── Observações (opcional)

PASSO 3: VALIDAÇÕES
├── Cru existe? ✅
├── Cru tem FT aprovada? ✅
├── Beneficiado existe? ✅
├── Beneficiado tem FT aprovada? ✅
├── Beneficiado tem receita? ✅
└── Beneficiado tem roteiro? ✅

PASSO 4: ENVIAR SOLICITAÇÃO
├── Status inicial: PENDENTE
├── Notifica PCP
└── Solicitação vinculada ao cru e beneficiado

PASSO 5: PCP RECEBE A SOLICITAÇÃO
├── Visualiza FT completa (cru + beneficiado)
├── Visualiza receita (conforme tipo)
├── Visualiza roteiro (sequência de máquinas)
├── Planeja produção
└── Registra número da OP (campo manual)
```

---

# 7. PERFIS E PERMISSÕES

## 7.1 Matriz de Permissões (MVP)

| Funcionalidade | COMERCIAL | TECELAGEM | BENEFICIAMENTO | ADMIN |
|----------------|-----------|-----------|----------------|-------|
| **Solicitações** | | | | |
| Criar solicitação | ✅ | ❌ | ❌ | ✅ |
| Editar sua solicitação | ✅ | ❌ | ❌ | ✅ |
| Excluir sua solicitação | ✅ | ❌ | ❌ | ✅ |
| Listar solicitações (próprias) | ✅ | ❌ | ❌ | - |
| Listar solicitações (recebidas) | ❌ | ✅ | ✅ | ✅ |
| Listar todas solicitações | ❌ | ❌ | ❌ | ✅ |
| Visualizar detalhe | ✅ | ✅ | ✅ | ✅ |
| Atualizar status (próprias) | ❌ | ❌ | ❌ | - |
| Atualizar status (recebidas) | ❌ | ✅ | ✅ | ✅ |
| Adicionar comentário | ✅ | ✅ | ✅ | ✅ |
| **Anexos** | | | | |
| Adicionar anexo | ✅ | ✅ | ✅ | ✅ |
| Remover anexo (próprios) | ✅ | ❌ | ❌ | ✅ |
| Remover anexo (qualquer) | ❌ | ❌ | ❌ | ✅ |
| **Dashboard** | | | | |
| Visualizar dashboard próprio | ✅ | ✅ | ✅ | - |
| Visualizar dashboard admin | ❌ | ❌ | ❌ | ✅ |

## 7.2 Matriz de Permissões (Pós-MVP - Adicionais)

| Funcionalidade | COMERCIAL | TECELAGEM | BENEFICIAMENTO | ADMIN |
|----------------|-----------|-----------|----------------|-------|
| **Cadastros** | | | | |
| CRUD Fios | ❌ | ❌ | ❌ | ✅ |
| CRUD Bases Urdume | ❌ | ✅ | ❌ | ✅ |
| CRUD Produtos Cru | ❌ | ✅ | ❌ | ✅ |
| CRUD Cores | ❌ | ❌ | ✅ | ✅ |
| CRUD Estampas | ❌ | ❌ | ✅ | ✅ |
| CRUD Acabamentos | ❌ | ❌ | ✅ | ✅ |
| CRUD Produtos Químicos | ❌ | ❌ | ✅ | ✅ |
| CRUD Máquinas | ❌ | ❌ | ❌ | ✅ |
| CRUD Operações | ❌ | ❌ | ❌ | ✅ |
| **Produtos** | | | | |
| Criar Produto Cru | ❌ | ✅ | ❌ | ✅ |
| Criar Produto Beneficiado | ❌ | ❌ | ✅ | ✅ |
| Aprovar Ficha Técnica | ✅ | ❌ | ❌ | ✅ |
| **Receitas** | | | | |
| Criar Receita Tinturaria | ❌ | ❌ | ✅ | ✅ |
| Criar Receita Estamparia | ❌ | ❌ | ✅ | ✅ |
| Criar Receita Termofixação | ❌ | ❌ | ✅ | ✅ |
| **Roteiros** | | | | |
| Criar Roteiro Produção | ❌ | ❌ | ✅ | ✅ |
| **Solicitações Avançadas** | | | | |
| Solicitar Amostra | ✅ | ❌ | ❌ | ✅ |
| Solicitar Produção Tecelagem | ✅ | ❌ | ❌ | ✅ |
| Solicitar Produção Beneficiamento | ✅ | ❌ | ❌ | ✅ |
| **PCP** | | | | |
| Listar solicitações amostra | ❌ | ❌ | ❌ | ✅ |
| Listar solicitações produção | ❌ | ❌ | ❌ | ✅ |
| Atualizar status amostra | ❌ | ❌ | ❌ | ✅ |
| Registrar número OP | ❌ | ❌ | ❌ | ✅ |
| **Usuários** | | | | |
| CRUD Usuários | ❌ | ❌ | ❌ | ✅ |
| **Relatórios** | | | | |
| Visualizar relatórios | ✅ | ✅ | ✅ | ✅ |

## 7.3 Roles e Descrições

### COMERCIAL
```
Responsabilidades:
├── Abrir solicitações de desenvolvimento
├── Acompanhar status das suas solicitações
├── Fornecer informações adicionais quando solicitado
└── Aprovar fichas técnicas (pós-MVP)

Acesso padrão:
├── Suas próprias solicitações (CRUD)
├── Dashboard com métricas próprias
└── Visualização de relatórios básicos
```

### TECELAGEM
```
Responsabilidades:
├── Receber solicitações de desenvolvimento tecelagem
├── Analisar briefings
├── Desenvolver produtos cru
├── Preencher fichas técnicas
└── Solicitar informações adicionais ao comercial

Acesso padrão:
├── Solicitações do tipo DESENVOLVIMENTO_TECELAGEM (recebidas)
├── CRUD de produtos cru
├── CRUD de bases de urdume
└── Visualização de fios (readonly)
```

### BENEFICIAMENTO
```
Responsabilidades:
├── Receber solicitações de desenvolvimento beneficiamento
├── Desenvolver produtos beneficiados
├── Criar receitas (tinturaria/estampa/termofixação)
├── Definir roteiros de produção
└── Solicitar informações adicionais

Acesso padrão:
├── Solicitações do tipo DESENVOLVIMENTO_BENEFICIAMENTO (recebidas)
├── CRUD de produtos beneficiados
├── CRUD de cores
├── CRUD de estampas
├── CRUD de receitas
├── CRUD de roteiros
└── Visualização de produtos cru (readonly)
```

### PCP
```
Responsabilidades:
├── Receber solicitações de amostra
├── Receber solicitações de produção
├── Planejar produção
├── Registrar números de OP
└── Atualizar status de amostra/produção

Acesso padrão:
├── Solicitações de amostra (recebidas)
├── Solicitações de produção (recebidas)
├── Visualização de FT completa
├── Visualização de receitas
├── Visualização de roteiros
└── Atualizar status (CONCLUIDO, EM_PRODUCAO)
```

### ADMIN
```
Responsabilidades:
├── Gerenciar todos cadastros base
├── Gerenciar usuários
├── Visualizar todas solicitações
├── Resolver problemas
└── Monitorar sistema

Acesso padrão:
├── Tudo (full access)
└── Painel administrativo com métricas avançadas
```

---

# 8. TELAS E INTERFACES (MVP)

## 8.1 Tela de Login

### Layout e Componentes
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │                     │                      │
│                    │     PDM PRO MODA     │                      │
│                    │  Sistema Têxtil      │                      │
│                    │                     │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │  Email:             │                      │
│                    │  ┌───────────────┐  │                      │
│                    │  │               │  │                      │
│                    │  └───────────────┘  │                      │
│                    │                     │                      │
│                    │  Senha:              │                      │
│                    │  ┌───────────────┐  │                      │
│                    │  │               │  │                      │
│                    │  └───────────────┘  │                      │
│                    │                     │                      │
│                    │  ┌───────────────┐  │                      │
│                    │  │   ENTRAR      │  │                      │
│                    │  └───────────────┘  │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│                    Teste: comercial@promoda.com / 123456       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Comportamento
| Elemento | Ação | Resultado |
|----------|------|-----------|
| Campo Email | Digitar email | Valida formato email |
| Campo Senha | Digitar senha | Mascarado (••••••) |
| Botão Entrar | Clicar | Autentica e redireciona para dashboard |
| Link "Esqueceu senha" | Clicar | (Pós-MVP) Envia email de recuperação |

### Validações
- Email obrigatório
- Senha obrigatória
- Credenciais inválidas → mensagem de erro
- Usuário inativo → mensagem de erro

## 8.2 Tela Dashboard (MVP)

### Layout Desktop
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ☰  PDM PRO MODA              🔔  👤 Ana Comercial                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Olá, Ana!                                                                  │
│  Bem-vindo ao PDM Pro Moda                                                  │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                           │
│  │ TOTAL       │ │ PENDENTES   │ │ CONCLUÍDOS  │                           │
│  │    12       │ │     5       │ │     7       │                           │
│  └─────────────┘ └─────────────┘ └─────────────┘                           │
│                                                                             │
│  Ações Rápidas                                                              │
│  ┌─────────────────────────┐ ┌─────────────────────────┐                   │
│  │ ➕ NOVA SOLICITAÇÃO      │ │ 📋 MINHAS SOLICITAÇÕES   │                   │
│  │ Criar briefing técnico  │ │ Acompanhar status        │                   │
│  └─────────────────────────┘ └─────────────────────────┘                   │
│                                                                             │
│  Atividades Recentes                                                        │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ #123 - Cliente A - Status: PENDENTE - 2 dias atrás          │           │
│  │ #122 - Cliente B - Status: EM_ANALISE - 3 dias atrás        │           │
│  │ #121 - Cliente C - Status: CONCLUIDO - 5 dias atrás         │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layout Mobile
```
┌─────────────────┐
│ ☰ PDM PRO MODA  │
│ 🔔 👤           │
├─────────────────┤
│ Olá, Ana!       │
│                 │
│ ┌─────┐ ┌─────┐ │
│ │ 12  │ │ 5   │ │
│ │TOTAL│ │PEND │ │
│ └─────┘ └─────┘ │
│ ┌─────┐         │
│ │ 7   │         │
│ │CONC │         │
│ └─────┘         │
│                 │
│ Ações Rápidas   │
│ ┌─────────────┐ │
│ │➕ NOVA      │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │📋 MINHAS    │ │
│ └─────────────┘ │
│                 │
│ Atividades      │
│ • #123 - Cliente│
│   A - PENDENTE  │
│ • #122 - Cliente│
│   B - EM_ANALISE│
│                 │
├─────────────────┤
│ 🏠  📋  👤  ⚙️  │
└─────────────────┘
```

## 8.3 Tela Nova Solicitação (MVP - Principal)

### Layout - Passo 1: Dados Comerciais
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NOVA SOLICITAÇÃO DE DESENVOLVIMENTO                                        │
│  Passo 1 de 3: Dados Comerciais                                             │
│  ⬤━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tipo de Solicitação *                                                      │
│  ○ Desenvolvimento Tecelagem (tecido cru)                                   │
│  ○ Desenvolvimento Beneficiamento (cor/estampa)                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Cliente *                                                           │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Digite o nome do cliente                                        │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │ CNPJ                                                                │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ 00.000.000/0001-00                                             │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │ Projeto / Coleção                                                   │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Ex: Verão 2025, Coleção Inverno                                 │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │ Prazo Desejado                                                      │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ 15/12/2024                                                     │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                          ┌─────────┐ ┌─────────────────┐   │
│                                          │ VOLTAR  │ │ PRÓXIMO →       │   │
│                                          └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layout - Passo 2: Briefing Técnico
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NOVA SOLICITAÇÃO DE DESENVOLVIMENTO                                        │
│  Passo 2 de 3: Briefing Técnico                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ SEÇÃO 1: USO FINAL ─────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │ Tipo de Uniforme *                                                   │  │
│  │ ○ Operacional pesado (obra, indústria)                               │  │
│  │ ○ Profissional técnico (logística, manutenção)                       │  │
│  │ ○ Corporativo (escritório)                                           │  │
│  │ ○ Esportivo / ativo                                                  │  │
│  │ ○ Saúde / hospitalar                                                 │  │
│  │                                                                       │  │
│  │ Ambiente de uso * (pode marcar mais de um)                           │  │
│  │ ☐ Interno  ☐ Externo                                                 │  │
│  │                                                                       │  │
│  │ Temperatura *                                                        │  │
│  │ ○ Calor intenso  ○ Ambiente controlado  ○ Frio  ○ Variado            │  │
│  │                                                                       │  │
│  │ Condições especiais                                                  │  │
│  │ ☐ Contato com sujeira  ☐ Contato com óleo/graxa                      │  │
│  │                                                                       │  │
│  │ Abrasão *                                                            │  │
│  │ ○ Baixa (escritório)  ○ Média (logística)  ○ Alta (indústria)        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ SEÇÃO 2: PERFORMANCE ────────────────────────────────────────────────┐ │
│  │ Marque as características necessárias (mínimo 3):                     │ │
│  │                                                                       │ │
│  │ ☐ Respirável         ☐ Secagem rápida    ☐ Antiodor                  │ │
│  │ ☐ Antibacteriano     ☐ Anti-pilling     ☐ Alta resistência abrasão   │ │
│  │ ☐ Elasticidade                                                       │ │
│  │                                                                       │ │
│  │ Frequência de lavagem *                                              │ │
│  │ ○ Diária  ○ Semanal  ○ Mensal                                        │ │
│  │                                                                       │ │
│  │ Tipo de lavagem *                                                    │ │
│  │ ○ Doméstica  ○ Industrial                                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ... (Seções 3 a 8 continuam)                                              │
│                                                                             │
│                                          ┌─────────┐ ┌─────────────────┐   │
│                                          │ VOLTAR  │ │ PRÓXIMO →       │   │
│                                          └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layout - Passo 3: Anexos e Envio
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NOVA SOLICITAÇÃO DE DESENVOLVIMENTO                                        │
│  Passo 3 de 3: Anexos e Envio                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Anexos e Links de Referência                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  📎 Arraste arquivos ou clique para selecionar              │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────┐                                                        │   │
│  │  │ + LINK  │  Adicionar link (YouTube, Google Sheets, etc)         │   │
│  │  └─────────┘                                                        │   │
│  │                                                                     │   │
│  │  Arquivos adicionados:                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 📄 briefing_cliente.pdf                                   ❌ │   │   │
│  │  │ 🖼️ referencia_tecido.jpg                                   ❌ │   │   │
│  │  │ 🔗 YouTube - Vídeo de referência                    🔗 ❌ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Resumo da Solicitação                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Cliente: Moda Fitness Ltda                                          │   │
│  │ Tipo: Desenvolvimento Tecelagem                                     │   │
│  │ Briefing: Completo (8 seções)                                       │   │
│  │ Anexos: 3 arquivos                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                          ┌─────────┐ ┌─────────────────┐   │
│                                          │ VOLTAR  │ │  ENVIAR →       │   │
│                                          └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.4 Tela Lista de Solicitações

### Layout Desktop com Filtros
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MINHAS SOLICITAÇÕES                                           [+ NOVA]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Filtros:                                                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Todos ▼    │ │ Todos ▼    │ │ Buscar...  │ │ 🔍         │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ID    │ CLIENTE          │ PROJETO    │ STATUS        │ DATA        │   │
│  ├───────┼──────────────────┼────────────┼───────────────┼─────────────┤   │
│  │ #124  │ Moda Fitness     │ Verão 2025 │ 🟡 PENDENTE   │ 10/12/2024  │   │
│  │ #123  │ Têxtil Sul       │ Inverno    │ 🟢 EM_ANALISE │ 08/12/2024  │   │
│  │ #122  │ Uniformes Plus   │ Corporativo│ 🔵 AGUARDANDO  │ 05/12/2024  │   │
│  │ #121  │ Esportes BR      │ Verão 2025 │ ✅ CONCLUIDO   │ 01/12/2024  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Mostrando 4 de 12 registros                    ◀ 1 2 3 ▶                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.5 Tela Detalhe da Solicitação

### Layout Desktop
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SOLICITAÇÃO #124 - Moda Fitness Ltda                    [Status: PENDENTE] │
│  Criada em: 10/12/2024 por: Ana Comercial                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Dados] [Briefing] [Anexos] [Histórico]                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ DADOS COMERCIAIS ────────────────────────────────────────────────────┐ │
│  │ Cliente: Moda Fitness Ltda                                            │ │
│  │ CNPJ: 12.345.678/0001-90                                              │ │
│  │ Projeto: Coleção Verão 2025                                           │ │
│  │ Prazo Desejado: 15/01/2025                                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ BRIEFING TÉCNICO ─────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │ ┌─ 1. USO FINAL ───────────────────────────────────────────────────┐ │ │
│  │ │ Tipo: Esportivo / ativo                                           │ │ │
│  │ │ Ambiente: Externo                                                 │ │ │
│  │ │ Temperatura: Calor intenso                                        │ │ │
│  │ │ Abrasão: Alta                                                     │ │ │
│  │ └───────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │ ┌─ 2. PERFORMANCE ─────────────────────────────────────────────────┐  │ │
│  │ │ Características: Respirável, Secagem rápida, Antiodor             │  │ │
│  │ │ Lavagem: Diária / Industrial                                      │  │ │
│  │ └───────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │ ... (demais seções)                                                   │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ AÇÕES ────────────────────────────────────────────────────────────────┐│
│  │                                                                         ││
│  │ Se você é do desenvolvimento:                                           ││
│  │ ┌──────────────┐ ┌────────────────────────┐ ┌──────────────┐          ││
│  │ │ INICIAR      │ │ SOLICITAR INFORMAÇÕES   │ │ CONCLUIR     │          ││
│  │ │ ANÁLISE      │ │                         │ │ ANÁLISE      │          ││
│  │ └──────────────┘ └────────────────────────┘ └──────────────┘          ││
│  │                                                                         ││
│  │ Adicionar comentário:                                                   ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐││
│  │ │ Digite seu comentário aqui...                                       │││
│  │ └─────────────────────────────────────────────────────────────────────┘││
│  │ ┌──────────┐                                                           ││
│  │ │ ENVIAR   │                                                           ││
│  │ └──────────┘                                                           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. TELAS E INTERFACES (PÓS-MVP)

## 9.1 Tela Cadastro de Produto Cru

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NOVO PRODUTO CRU - DESENVOLVIMENTO TECELAGEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Dados Básicos                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Grupo * (5 caracteres)                                              │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ K1820                                                           │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │ 💡 K = largura 2,50m | 18 = batidas | 20 = fio 20/1                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Composição                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Base de Urdume *                                                   │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Selecione a base de urdume...                                   │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │ Fio da Trama *                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Selecione o fio da trama...                                    │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │ Ligamento *                                                        │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ TAFETA ▼                                                        │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Especificações                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Gramatura (g/m²) *              Largura Nominal (m) *               │   │
│  │ ┌──────────────┐                ┌──────────────┐                    │   │
│  │ │ 220          │                │ 1.50         │                    │   │
│  │ └──────────────┘                └──────────────┘                    │   │
│  │                                                                     │   │
│  │ Densidade Urdume (fios/cm)      Densidade Trama (fios/cm)           │   │
│  │ ┌──────────────┐                ┌──────────────┐                    │   │
│  │ │ 24.5         │                │ 18.0         │                    │   │
│  │ └──────────────┘                └──────────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Código Gerado: 2.K1820.CRU.000CRU                                          │
│                                                                             │
│                                          ┌─────────┐ ┌─────────────────┐   │
│                                          │CANCELAR │ │  SALVAR         │   │
│                                          └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9.2 Tela Receita de Tinturaria

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RECEITA DE TINTURARIA - Azul Marinho (2.K1820.TIN.000001)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Informações Básicas                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Código: RT-K1820-TIN-001                     Versão: 1              │   │
│  │ Máquina: JIGGER-01 - Jigger 500L                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Parâmetros do Processo                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Temperatura: 120 °C     Tempo: 45 min     pH: 4.5     Relação: 1:8  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Produtos Químicos                                                    [+ ]  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Produto                    │ Quantidade │ Unidade │ Ações            │   │
│  ├────────────────────────────┼────────────┼─────────┼──────────────────┤   │
│  │ Corante Azul Reativo       │ 3.5        │ %       │ ✏️ ❌             │   │
│  │ Sal (Cloreto de Sódio)     │ 50         │ g/L     │ ✏️ ❌             │   │
│  │ Carbonato de Sódio         │ 20         │ g/L     │ ✏️ ❌             │   │
│  │ Umectante                  │ 1          │ g/L     │ ✏️ ❌             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Curva de Tingimento                                                 [+ ]  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Etapa │ Temperatura │ Tempo │ Rampa │ Observação                    │   │
│  ├───────┼─────────────┼───────┼───────┼────────────────────────────────┤   │
│  │ 1     │ 40°C        │ 10min │ 2°C/m │ Adicionar corante             │   │
│  │ 2     │ 60°C        │ 15min │ 1.5°C │ Adicionar sal                 │   │
│  │ 3     │ 80°C        │ 20min │ 1°C/m │ Adicionar carbonato           │   │
│  │ 4     │ 120°C       │ 30min │ 1°C/m │ Manter                         │   │
│  │ 5     │ 60°C        │ 15min │ -2°C/ │ Resfriamento                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                          ┌─────────┐ ┌─────────────────┐   │
│                                          │CANCELAR │ │  SALVAR RECEITA │   │
│                                          └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9.3 Tela Roteiro de Produção

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ROTEIRO DE PRODUÇÃO - Tecido Estampado (2.K1820.001.500101)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Sequência de Produção (arraste para reordenar)                      [+ ]  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │ ┌────┐ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ 1  │ │ OPERAÇÃO: PREPARAR                                      │ │   │
│  │ └────┘ │ MÁQUINA: Enroladeira 2000mm (ENROL-01)                  │ │   │
│  │       │ PARÂMETROS: Velocidade 50m/min, Tensão 2.5kg             │ │   │
│  │       │ INSTRUÇÕES: Inspecionar defeitos e emendar               │ │   │
│  │       │                                      [✏️] [❌] [⤴️]        │ │   │
│  ├───────┼─────────────────────────────────────────────────────────┤ │   │
│  │ ┌────┐ │                                                         │ │   │
│  │ │ 2  │ │ OPERAÇÃO: TINGIR                                        │ │   │
│  │ └────┘ │ MÁQUINA: Turbo Jet 300kg (TURBO-01)                     │ │   │
│  │       │ PARÂMETROS: Temperatura 120°C, Tempo 45min               │ │   │
│  │       │ INSTRUÇÕES: Seguir receita RT-K1820-TIN-001              │ │   │
│  │       │                                      [✏️] [❌] [⤴️]        │ │   │
│  ├───────┼─────────────────────────────────────────────────────────┤ │   │
│  │ ┌────┐ │                                                         │ │   │
│  │ │ 3  │ │ OPERAÇÃO: SECAR                                        │ │   │
│  │ └────┘ │ MÁQUINA: Secadeira Vertical (SEC-01)                    │ │   │
│  │       │ PARÂMETROS: Temperatura 110°C, Tensão 2.0kg             │ │   │
│  │       │ INSTRUÇÕES: Secagem após tingimento                     │ │   │
│  │       │                                      [✏️] [❌] [⤴️]        │ │   │
│  ├───────┼─────────────────────────────────────────────────────────┤ │   │
│  │ ┌────┐ │                                                         │ │   │
│  │ │ 4  │ │ OPERAÇÃO: ESTAMPAR                                      │ │   │
│  │ └────┘ │ MÁQUINA: Rotativa 8 Cores (ESTAMPA-01)                  │ │   │
│  │       │ PARÂMETROS: Velocidade 30m/min, Pressão 2.5kg/cm²       │ │   │
│  │       │ INSTRUÇÕES: Estampa 5001/01, seguir receita RE-5001     │ │   │
│  │       │                                      [✏️] [❌] [⤴️]        │ │   │
│  ├───────┼─────────────────────────────────────────────────────────┤ │   │
│  │ ┌────┐ │                                                         │ │   │
│  │ │ 5  │ │ OPERAÇÃO: ACABAR                                       │ │   │
│  │ └────┘ │ MÁQUINA: Calandra 3 Rolos (CALANDRA-01)                 │ │   │
│  │       │ PARÂMETROS: Temperatura 150°C, Pressão 40kg/cm²         │ │   │
│  │       │ INSTRUÇÕES: Dar brilho e toque final                    │ │   │
│  │       │                                      [✏️] [❌] [⤴️]        │ │   │
│  └───────┴─────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                          ┌─────────┐ ┌─────────────────┐   │
│                                          │CANCELAR │ │  SALVAR ROTEIRO │   │
│                                          └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 10. REGRAS DE VALIDAÇÃO E NEGÓCIO

## 10.1 Validações de Formulário (MVP)

### Validações Comerciais
| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| Cliente | Não pode estar vazio | "Cliente é obrigatório" |
| Tipo | Deve ser selecionado | "Selecione o tipo de desenvolvimento" |

### Validações Briefing (seção por seção)

#### Seção 1: Uso Final
| Campo | Validação | Mensagem |
|-------|-----------|----------|
| tipoUniforme | Selecionado | "Selecione o tipo de uniforme" |
| ambiente | Pelo menos um marcado | "Selecione pelo menos um ambiente" |
| temperatura | Selecionada | "Selecione a temperatura do ambiente" |
| abrasao | Selecionada | "Selecione o nível de abrasão" |

#### Seção 2: Performance
| Campo | Validação | Mensagem |
|-------|-----------|----------|
| Características | Mínimo 3 marcadas | "Selecione pelo menos 3 características de performance" |
| frequenciaLavagem | Selecionada | "Selecione a frequência de lavagem" |
| tipoLavagem | Selecionado | "Selecione o tipo de lavagem" |

#### Seção 3: Gramatura
| Campo | Validação | Mensagem |
|-------|-----------|----------|
| faixa | Selecionada | "Selecione a faixa de gramatura" |

#### Seções 4 a 8: Validações similares (campos obrigatórios)

## 10.2 Validações de Negócio (Pós-MVP)

### Validação de Códigos
```javascript
REGRAS:
├── Código completo deve ser único no banco
├── Grupo deve ter exatamente 5 caracteres
├── Para CRU: item deve ser "000CRU"
├── Para TIN: item deve ter 6 dígitos numéricos
├── Para estampado: subgrupo deve ter 3 dígitos, item 6 dígitos
└── Código não pode ser editado após criação
```

### Validação de Hierarquia
```javascript
ANTES DE CRIAR PRODUTO CRU:
├── Base de Urdume deve existir (se informada)
├── Fio da Trama deve existir (se informado)
└── Status da base/fio deve ser "ATIVO"

ANTES DE CRIAR PRODUTO BENEFICIADO:
├── Produto Cru deve existir
├── Produto Cru deve ter status "APROVADO"
├── Cor sólida deve existir (se tipo TINGIDO)
├── Estampa deve existir (se tipo ESTAMPADO)
└── Cor de fundo deve existir (se tipo ESTAMPADO)
```

### Validação de Solicitação de Produção
```javascript
PRODUÇÃO TECELAGEM:
├── Produto Cru existe? ✅
├── Produto Cru status = "APROVADO"? ✅
├── Quantidade > 0? ✅
└── Data desejada não pode ser no passado? ⚠️ (alerta)

PRODUÇÃO BENEFICIAMENTO:
├── Produto Cru existe? ✅
├── Produto Cru status = "APROVADO"? ✅
├── Produto Beneficiado existe? ✅
├── Produto Beneficiado status = "APROVADO"? ✅
├── Produto Beneficiado tem receita? ✅
├── Produto Beneficiado tem roteiro? ✅
├── Quantidade > 0? ✅
└── Data desejada não pode ser no passado? ⚠️ (alerta)
```

## 10.3 Regras de Notificação

### MVP
| Evento | Quem notifica | Método | Mensagem |
|--------|---------------|--------|----------|
| Nova solicitação criada | Sistema | Email + In-app | "Nova solicitação #{id} de {cliente}" |
| Status alterado para AGUARDANDO_INFO | Sistema | Email + In-app | "Solicitação #{id} aguarda informações" |
| Comentário adicionado | Sistema | Email + In-app | "Novo comentário na solicitação #{id}" |

### Pós-MVP (adicionais)
| Evento | Quem notifica | Método | Mensagem |
|--------|---------------|--------|----------|
| FT aguardando aprovação | Sistema | Email + In-app | "Ficha técnica do produto {codigo} aguarda aprovação" |
| Produto aprovado | Sistema | Email + In-app | "Produto {codigo} foi aprovado" |
| Solicitação de produção criada | Sistema | Email + In-app | "Nova solicitação de produção #{id}" |

---

# 11. INTEGRAÇÕES E SERVIÇOS EXTERNOS

## 11.1 Vercel Blob (Armazenamento de Arquivos)

### Propósito
Armazenar arquivos enviados como anexos (imagens, PDFs, documentos)

### Configuração
```javascript
Endpoints: PUT /api/upload (client-side)
Limite: 10MB por arquivo
Tipos permitidos: .pdf, .docx, .xlsx, .jpg, .jpeg, .png, .mp4
Retenção: Permanente (enquanto a solicitação existir)
```

### Fluxo de Upload
1. Usuário seleciona arquivo no frontend
2. Frontend envia multipart/form-data para /api/upload
3. API salva no Vercel Blob
4. API retorna URL pública
5. Frontend salva URL no campo anexos.url

## 11.2 Resend (Emails)

### Propósito
Enviar notificações por email para os usuários

### Configuração
```javascript
Email remetente: notificacoes@promoda.com
Template: HTML responsivo
Domínios autorizados: promoda.com (produção)
Rate limit: 100 emails/dia (gratuito)
```

### Eventos com Email
| Evento | Destinatários | Template |
|--------|---------------|----------|
| Nova solicitação | Desenvolvimento (Tecelagem/Beneficiamento) | nova-solicitacao |
| Solicitação atualizada | Comercial (se for AGUARDANDO_INFO) | solicitacao-update |
| Comentário adicionado | Todos envolvidos | novo-comentario |
| FT aprovada | Desenvolvimento | ft-aprovada |

## 11.3 Upstash Redis (Cache e Rate Limit)

### Propósito
- Cache de consultas frequentes
- Rate limiting para API
- Filas para processamento assíncrono (emails)

### Configuração
```javascript
Rate limit: 100 requisições por IP por minuto
Cache TTL: 5 minutos para listas, 1 hora para detalhes
```

---

# 12. CONFIGURAÇÕES DE AMBIENTE

## 12.1 Variáveis de Ambiente

### .env.local (Desenvolvimento Local)
```bash
# Database (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx.xxx.neon.tech/db?sslmode=require"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token"

# Resend (Emails)
RESEND_API_KEY="re_api_key"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="token"

# Opcional: Sentry (Monitoramento)
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Opcional: Vercel Analytics
VERCEL_ANALYTICS_ID="xxx"
```

### .env.production (Produção)
```bash
# Mesmas variáveis, com valores de produção
NEXTAUTH_URL="https://pdmtextil.com.br"
# Os valores reais serão configurados no painel da Vercel
```

## 12.2 Configuração Vercel

### vercel.json
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/crons/limpar-sessoes",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/crons/notificar-prazos",
      "schedule": "0 9 * * *"
    }
  ],
  "env": {
    "NEXTAUTH_URL": "https://pdmtextil.com.br"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

## 12.3 Configuração Neon (Banco de Dados)

### Estratégia de Branches
| Branch | Propósito | Tipo |
|--------|-----------|------|
| main | Produção | Primary |
| staging | Homologação | Branch da main |
| dev | Desenvolvimento | Branch do staging |
| feature-* | Features específicas | Branch do dev |

### Connection Pooling
```javascript
// Usar pooled connection para serverless
DATABASE_URL="postgres://user:password@ep-xxx-pooler.xxx.neon.tech/db?sslmode=require"
```

---

# 13. CRONOGRAMA DE DESENVOLVIMENTO

## 13.1 Sprint 1: Setup e MVP (2 semanas)

### Objetivo
Base do projeto + funcionalidade principal (criar solicitação de desenvolvimento)

### Tarefas Detalhadas

**Dia 1-2: Setup do Projeto**
- [ ] Criar repositório `pdmtextil` (clone do template)
- [ ] Configurar Next.js 14 com TypeScript
- [ ] Configurar Tailwind CSS e shadcn/ui
- [ ] Configurar Drizzle ORM e Neon
- [ ] Configurar NextAuth.js
- [ ] Configurar Vercel Blob
- [ ] Configurar ESLint e Prettier

**Dia 3-4: Banco de Dados**
- [ ] Criar schema de usuários
- [ ] Criar schema de solicitações
- [ ] Criar schema de anexos
- [ ] Criar migrations
- [ ] Criar seed de usuários
- [ ] Testar conexão com Neon

**Dia 5-6: Autenticação**
- [ ] Implementar tela de login
- [ ] Implementar NextAuth com CredentialsProvider
- [ ] Implementar middleware de proteção
- [ ] Implementar logout
- [ ] Testar perfis de acesso

**Dia 7-9: Tela de Nova Solicitação**
- [ ] Criar layout com 3 passos
- [ ] Implementar Step 1: Dados Comerciais
- [ ] Implementar Step 2: Briefing (8 seções)
- [ ] Implementar Step 3: Anexos e Envio
- [ ] Integrar com API de upload
- [ ] Validação de formulário com Zod

**Dia 10-11: API de Solicitações**
- [ ] Implementar POST /api/solicitacoes
- [ ] Implementar GET /api/solicitacoes
- [ ] Implementar GET /api/solicitacoes/[id]
- [ ] Implementar PATCH /api/solicitacoes/[id]/status
- [ ] Implementar validações

**Dia 12-13: Lista e Detalhe**
- [ ] Tela de listagem de solicitações
- [ ] Filtros e busca
- [ ] Tela de detalhe da solicitação
- [ ] Abas (Dados, Briefing, Anexos, Histórico)
- [ ] Botões de ação (status)

**Dia 14: Finalização MVP**
- [ ] Testes manuais completos
- [ ] Correção de bugs
- [ ] Deploy na Vercel (branch main)
- [ ] Documentação de uso

## 13.2 Sprint 2: Cadastros Base (2 semanas)

### Objetivo
CRUD completo para todos cadastros necessários

### Tarefas
- [ ] Schema de Fios (Nível 7)
- [ ] CRUD de Fios (listagem, criação, edição, exclusão)
- [ ] Schema de Bases de Urdume (Nível 4)
- [ ] CRUD de Bases de Urdume
- [ ] Schema de Produtos Cru (Nível 2)
- [ ] CRUD de Produtos Cru
- [ ] Schema de Cores (sólidas e fundo)
- [ ] CRUD de Cores
- [ ] Schema de Estampas
- [ ] CRUD de Estampas
- [ ] Schema de Acabamentos
- [ ] CRUD de Acabamentos
- [ ] Schema de Produtos Químicos (Nível 9)
- [ ] CRUD de Produtos Químicos
- [ ] Schema de Máquinas e Operações
- [ ] CRUD de Máquinas e Operações

## 13.3 Sprint 3: Produtos e Fichas Técnicas (2 semanas)

### Objetivo
Desenvolvimento de produtos cru e beneficiados

### Tarefas
- [ ] Schema de Produtos Beneficiados
- [ ] CRUD de Produtos Beneficiados
- [ ] Gerador de códigos Systêxtil
- [ ] Tela de criação de Produto Cru
- [ ] Tela de criação de Produto Beneficiado
- [ ] Validações de hierarquia
- [ ] Aprovação de Ficha Técnica (comercial)
- [ ] Histórico de versões

## 13.4 Sprint 4: Receitas e Roteiros (2 semanas)

### Objetivo
Receitas de beneficiamento e roteiros de produção

### Tarefas
- [ ] Schema de Receitas de Tinturaria
- [ ] Schema de Receitas de Termofixação
- [ ] Schema de Receitas de Estamparia
- [ ] Schema de Roteiros de Produção
- [ ] Schema de Etapas do Roteiro
- [ ] Tela de criação de Receita de Tinturaria
- [ ] Tela de criação de Receita de Estamparia
- [ ] Tela de criação de Roteiro (drag & drop)
- [ ] Validações por tipo de beneficiamento

## 13.5 Sprint 5: Amostra e Produção (1 semana)

### Objetivo
Solicitações de amostra e produção

### Tarefas
- [ ] Schema de Solicitação de Amostra
- [ ] Tela de solicitação de amostra (estilo Excel)
- [ ] Schema de Solicitação de Produção (Tecelagem/Beneficiamento)
- [ ] Tela de solicitação de produção
- [ ] Validações específicas por tipo
- [ ] Dashboard PCP
- [ ] Campo para número da OP

## 13.6 Sprint 6: Testes e Deploy (1 semana)

### Objetivo
Testes completos e deploy em produção

### Tarefas
- [ ] Testes unitários (Jest)
- [ ] Testes de integração (API)
- [ ] Testes end-to-end (Playwright)
- [ ] Testes de performance
- [ ] Deploy em staging
- [ ] Testes com usuários reais
- [ ] Correções e ajustes
- [ ] Deploy em produção
- [ ] Backup e monitoramento
- [ ] Documentação final

---

# 14. GLOSSÁRIO TÉCNICO

## 14.1 Termos do Sistema

| Termo | Definição |
|-------|-----------|
| **PDM** | Product Data Management - Gestão de Dados de Produto |
| **Solicitação de Desenvolvimento** | Pedido formal para criar um novo produto têxtil |
| **Briefing** | Documento com todas especificações técnicas e comerciais |
| **Ficha Técnica (FT)** | Documento com todas características do produto |
| **Produto Cru** | Tecido que sai do tear sem beneficiamento |
| **Produto Beneficiado** | Tecido após tingimento, estamparia ou termofixação |
| **Aprovação** | Validação formal do comercial sobre a FT |
| **Receita** | Conjunto de parâmetros químicos e físicos para beneficiamento |
| **Roteiro** | Sequência de operações e máquinas para produção |
| **PCP** | Planejamento e Controle de Produção |
| **OP** | Ordem de Produção (no Systêxtil) |

## 14.2 Termos Têxteis

| Termo | Definição |
|-------|-----------|
| **Urdume** | Conjunto de fios longitudinais no tear |
| **Trama** | Fio transversal que cruza o urdume |
| **Ligamento** | Padrão de entrelaçamento (TAFETA, SARJA, CETIM) |
| **Gramatura** | Peso por metro quadrado (g/m²) |
| **Densidade** | Número de fios por centímetro |
| **Título** | Espessura do fio (Ne, Nm, Denier) |
| **Torção** | Número de voltas por metro (Z ou S) |
| **Alvejamento** | Processo de branqueamento |
| **Termofixação** | Processo térmico para estabilizar dimensões |
| **Tingimento** | Processo de coloração sólida |
| **Estamparia** | Aplicação de desenhos coloridos |
| **Acabamento** | Processo final (amaciamento, calandragem, etc) |
| **Encolhimento** | Redução dimensional após lavagem (%) |
| **Solidez** | Resistência da cor à lavagem, luz, fricção |

## 14.3 Termos de Código

| Termo | Definição |
|-------|-----------|
| **Nível** | Dígito que indica o tipo de produto no Systêxtil |
| **Grupo** | Identificador da estrutura do tecido (5 caracteres) |
| **Subgrupo** | Situação ou cor de fundo (3 caracteres) |
| **Item** | Identificador específico (6 caracteres) |
| **CRU** | Subgrupo para tecido não beneficiado |
| **TIN** | Subgrupo para tecido tingido |
| **TER** | Subgrupo para tecido termofixado |
| **XXX** | Subgrupo padrão para fios e químicos |

## 14.4 Termos de Tecnologia

| Termo | Definição |
|-------|-----------|
| **MVP** | Minimum Viable Product - versão mínima viável |
| **API** | Application Programming Interface |
| **ORM** | Object-Relational Mapping (Drizzle) |
| **JWT** | JSON Web Token (autenticação) |
| **SSR** | Server-Side Rendering |
| **CSR** | Client-Side Rendering |
| **JSONB** | Formato de dados JSON no PostgreSQL |
| **CRUD** | Create, Read, Update, Delete |
| **FK** | Foreign Key (chave estrangeira) |
| **PK** | Primary Key (chave primária) |

---

# FIM DA DOCUMENTAÇÃO

---

**Documento Versão:** 1.0  
**Data:** Abril/2026  
**Próximo Passo:** Iniciar desenvolvimento pela Sprint 1 (Setup e MVP)

Este documento contém todas as informações necessárias para que uma equipe de desenvolvimento ou uma IA possa construir o sistema do zero, desde o MVP até o produto final completo, seguindo as regras de negócio da Pro Moda Têxtil e as boas práticas da stack escolhida.