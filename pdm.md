# PDM Pro Têxtil — Documentação Completa do Sistema

> **PDM** = Product Data Management (Gestão de Dados de Produto)  
> Sistema de gestão de desenvolvimento de produtos têxteis.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Projeto](#3-arquitetura-do-projeto)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Modelo Entidade-Relacionamento (MER)](#5-modelo-entidade-relacionamento-mer)
6. [Regras de Negócio Detalhadas](#6-regras-de-negócio-detalhadas)
7. [Fluxo de Status (Máquina de Estados)](#7-fluxo-de-status-máquina-de-estados)
8. [Sistema de Autenticação e Permissões](#8-sistema-de-autenticação-e-permissões)
9. [Sistema de Notificações e E-mail](#9-sistema-de-notificações-e-e-mail)
10. [Sistema de Integração com APIs Externas](#10-sistema-de-integração-com-apis-externas)
11. [Chat Corporativo](#11-chat-corporativo)
12. [Referência da API REST](#12-referência-da-api-rest)
13. [Padrões de Código e Convenções](#13-padrões-de-código-e-convenções)
14. [Considerações para Implementação do Módulo CRM](#14-considerações-para-implementação-do-módulo-crm)

---

## 1. Visão Geral

O **PDM Pro Têxtil** é um sistema web completo para gestão do ciclo de vida de desenvolvimento de produtos têxteis. Ele conecta os departamentos **Comercial**, **Desenvolvimento (Tecelagem e Beneficiamento)** e **PCP** em uma plataforma única.

### Principais Fluxos

```
Comercial → Solicitação de Desenvolvimento → Produto Cru (Ficha Técnica)
                                              ├── Composição (fios + %)
                                              ├── Estrutura Têxtil (trama/urdume)
                                              ├── Amostras Tecido Cru → Kanban
                                              └── Acabamentos
                                                    ├── Amostras Acabamento → Kanban
                                                    └── Receitas de Beneficiamento

Solicitação → Produto → Amostras → Produção → Pilotagem → Aprovação Cliente
```

### Fluxo de Desenvolvimento Completo

```
Briefing → Solicitação → Produto Cru → Amostras (Tecido Cru) → Acabamento → Amostras (Acabamento) → Receita → Aprovação → Produção
```

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Framework** | Next.js (App Router) | 14.2 |
| **Linguagem** | TypeScript | 5.x |
| **Frontend** | React | 18.x |
| **Estilização** | Tailwind CSS + shadcn/ui + Base UI | 3.4 |
| **ORM** | Drizzle ORM | 0.45 |
| **Banco de Dados** | PostgreSQL (Neon Serverless) | - |
| **Autenticação** | NextAuth.js (Credentials + JWT) | 4.24 |
| **Armazenamento** | Vercel Blob | - |
| **PDF** | jsPDF + jspdf-autotable | 2.5 / 3.8 |
| **Gráficos** | Recharts | 3.8 |
| **Formulários** | React Hook Form + Zod | 7.77 / 3.25 |
| **Drag & Drop** | dnd-kit | 6.3 |
| **Tabelas** | TanStack Table | 8.21 |
| **Upload** | react-dropzone | 15 |
| **Toast/Notificações** | Sonner | 2.0 |
| **Cache/Estado Servidor** | TanStack Query | 5.100 |
| **E-mail** | Nodemailer | 7 |
| **Criptografia** | Node crypto (AES-256-GCM) | nativo |
| **Testes** | Vitest + Testing Library | 4.1 / 16 |
| **Hospedagem** | Vercel | - |

---

## 3. Arquitetura do Projeto

### Padrão Arquitetural

O sistema utiliza **Next.js 14 App Router** com:

- **Frontend**: React Server Components (RSC) + Client Components (`"use client"`)
- **Backend**: API Routes (Route Handlers) em `src/app/api/`
- **Banco**: Drizzle ORM com PostgreSQL (Neon serverless)
- **Autenticação**: JWT via NextAuth com adapter Drizzle

### Separação de Responsabilidades

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (dashboard)/        # Páginas protegidas (layout compartilhado)
│   ├── api/                # API Routes REST
│   ├── login/              # Página de login
│   └── page.tsx            # Landing page pública
├── components/             # Componentes React reutilizáveis
├── hooks/                  # React hooks customizados
├── lib/                    # Lógica de negócio, DB, utilitários
│   ├── db/                 # Conexão, schemas, migrations
│   │   ├── schema/         # Definições Drizzle ORM (31 tabelas)
│   │   └── index.ts        # Conexão PostgreSQL + Drizzle
│   ├── info-content/       # Conteúdo de ajuda contextual
│   └── ...                 # auth, email, crypto, log, etc.
├── middleware.ts           # Proteção de rotas (NextAuth)
└── types/                  # Tipos globais TypeScript
```

### Roteamento

O sistema usa **dois grupos de rotas**:
- **`(dashboard)`** — layout com sidebar, header, require auth
- Rotas públicas: `/login`, landing page `/`

### Camada de Dados

```
API Route → requireAuth() → Drizzle ORM → PostgreSQL (Neon)
                                        ↓
                              Retorno JSON → Client Component
```

---

## 4. Estrutura de Diretórios

```
src/
├── app/(dashboard)/
│   ├── admin/
│   │   ├── configuracoes/
│   │   │   ├── banco-dados/     # Gerenciar conexões DB
│   │   │   ├── empresa/         # Logo, CNPJ, endereço
│   │   │   ├── integracoes/     # APIs externas (ERP, WMS)
│   │   │   ├── permissoes/      # CRUD por perfil
│   │   │   ├── smtp/            # Servidor de e-mail
│   │   │   ├── status/          # Fluxos de status por módulo
│   │   │   ├── telas/           # Menus e página inicial por perfil
│   │   │   └── page.tsx         # Hub de configurações
│   │   ├── email-massa/         # Listas, modelos, envio
│   │   ├── notificacoes/        # Regras de notificação
│   │   ├── roles/               # Perfis de acesso
│   │   └── usuarios/            # CRUD de usuários
│   │       └── [id]/
│   ├── amostras/
│   │   ├── kanban/              # Kanban de amostras (drag-and-drop)
│   │   └── page.tsx             # Listagem com abas + foco
│   ├── cadastros/
│   │   ├── bases-urdume/
│   │   ├── clientes/
│   │   ├── cores/
│   │   ├── estampas/
│   │   ├── fios/
│   │   ├── fornecedores/
│   │   ├── produto-cru/         # Ficha técnica completa
│   │   │   └── [id]/            # Detalhe com abas
│   │   ├── produtos-quimicos/
│   │   ├── receitas/
│   │   └── page.tsx             # Hub de cadastros
│   ├── chat/                    # Chat corporativo
│   ├── comercial/
│   │   ├── clientes/
│   │   │   ├── [id]/
│   │   │   ├── novo/
│   │   │   └── page.tsx
│   │   ├── requisicoes-amostra-comercial/
│   │   │   ├── [id]/
│   │   │   ├── kanban/
│   │   │   ├── novo/
│   │   │   └── page.tsx
│   │   ├── requisicoes-corte/
│   │   │   ├── [id]/
│   │   │   ├── nova/
│   │   │   └── page.tsx
│   │   └── solicitacoes/
│   │       ├── [id]/
│   │       │   └── editar/
│   │       ├── kanban/
│   │       ├── nova/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── amostra-comercial/
│   │   ├── amostras/
│   │   ├── relatorios/
│   │   │   ├── amostra-comercial-por-status/
│   │   │   ├── amostras-por-status/
│   │   │   ├── atividade-usuario/
│   │   │   ├── historico-amostra/
│   │   │   ├── historico-solicitacao/
│   │   │   ├── solicitacoes-concluidas/
│   │   │   ├── solicitacoes-criadas/
│   │   │   ├── solicitacoes-por-status/
│   │   │   ├── tempo-status/
│   │   │   ├── tempo-status-amostras/
│   │   │   └── page.tsx
│   │   ├── requisicoes-corte/
│   │   └── page.tsx             # Dashboard principal
│   ├── documentos/
│   │   ├── romaneios/
│   │   └── page.tsx
│   ├── ferramentas/
│   │   ├── conversores/
│   │   ├── regra-de-tres/
│   │   └── page.tsx
│   └── perfil/
│       ├── menus/
│       └── page.tsx
├── app/api/
│   ├── admin/
│   │   ├── config/ (banco-dados, email-teste, empresa, smtp)
│   │   ├── email-massa/ (listas, modelos)
│   │   ├── integracoes/
│   │   ├── menus/
│   │   ├── notificacao-regras/
│   │   ├── pagina-inicial/
│   │   ├── permissoes/
│   │   ├── roles/
│   │   ├── status/
│   │   └── usuarios/
│   ├── amostras/
│   │   ├── status/              # PATCH avanço automático
│   │   └── route.ts             # GET listagem
│   ├── auth/
│   ├── cadastros/
│   │   ├── bases-urdume/
│   │   ├── clientes/
│   │   ├── cores/
│   │   ├── estampas/
│   │   ├── fios/
│   │   ├── fornecedores/
│   │   ├── produto-cru/ (composicao, estrutura, amostras, acabamentos, receitas)
│   │   ├── produtos-quimicos/
│   │   └── (import, modelo)
│   ├── chats/
│   │   ├── [id]/ (mensagens, ler)
│   │   ├── entidade/
│   │   └── nao-lidas/
│   ├── clientes/
│   ├── comercial/
│   │   └── requisicoes-corte/
│   ├── dashboard/ (stats, listas)
│   ├── db/ (migrate, seed)
│   ├── integracao/
│   ├── notificacoes/
│   ├── perfil/
│   ├── proxy-image/
│   ├── receitas/
│   ├── relatorios/ (10 endpoints)
│   ├── requisicoes-amostra-comercial/
│   ├── solicitacoes/
│   ├── user/ (menus, pagina-inicial)
│   └── usuarios/ativos/
├── components/
│   ├── chat/ (emoji-picker, entity-chat-button)
│   ├── exportar/
│   ├── forms/ (briefing, anexos, autocomplete)
│   ├── importar/ (fios, cores, clientes, estampas, etc.)
│   ├── integracao/
│   ├── kanban/ (kanban-board, kanban-amostras)
│   ├── layout/ (sidebar, header, nav, theme-toggle, command-search)
│   ├── links/
│   ├── query-provider.tsx
│   ├── receita/
│   └── ui/ (shadcn/ui: button, dialog, input, select, tabs, etc.)
├── hooks/
│   └── use-statuses.ts
└── lib/
    ├── db/
    │   ├── schema/ (31 arquivos de schema)
    │   ├── index.ts
    │   └── seed.ts
    ├── info-content/ (admin, cadastros, comercial, dashboard, etc.)
    ├── auth.ts
    ├── email.ts
    ├── notificar.ts
    ├── log.ts
    ├── crypto.ts
    ├── validation.ts
    ├── error-handler.ts
    ├── api-error.ts
    ├── dump.ts
    ├── db-admin.ts
    ├── export-utils.ts
    ├── search-registry.ts
    ├── status-utils.ts
    ├── tipos-status.ts
    ├── utils.ts
    ├── validate-ownership.ts
    └── gerar-*-pdf.ts (3 geradores)
```

---

## 5. Modelo Entidade-Relacionamento (MER)

### 5.1 🧑‍💼 Usuários e Acesso

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                usuarios                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ id (PK) │ email (UQ) │ password │ name │ role (FK→roles) │ ativo │          │
│ id_integracao │ pagina_inicial │ ultimo_acesso │ created_at │ updated_at     │
└──────────────────────────────────────────────────────────────────────────────┘
        1:N                                                        1:N
         │                                                          │
         │                                                          │
         ▼                                                          ▼
┌──────────────────┐                                       ┌──────────────────┐
│     sessions      │                                       │     roles        │
├──────────────────┤                                       ├──────────────────┤
│ id (PK)          │                                       │ id (PK)          │
│ user_id (FK)     │                                       │ name (UQ)        │
│ session_token    │                                       │ label            │
│ expires          │                                       │ description      │
└──────────────────┘                                       │ permissions      │
                                                           │ pagina_inicial   │
                                                           │ ativo            │
                                                           └──────────────────┘
```

### 5.2 📄 Solicitações de Desenvolvimento

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           solicitacoes                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ id (PK) │ tipo │ status │ solicitante_id (FK→usuarios) │ responsavel_id     │
│ cliente │ cnpj │ projeto │ briefing (JSONB) │ historico_comunicacao (JSONB)  │
│ observacoes │ prazo_desejado │ data_conclusao │ id_integracao              │
│ created_at │ updated_at                                                      │
└──────────────────────┬───────────────────────────────────────────────────────┘
        1:N             │             1:N
         │              │               │
         ▼              │               ▼
┌──────────────────┐   │   ┌──────────────────────────────┐
│     anexos       │   │   │      produtos_cru             │
├──────────────────┤   │   ├──────────────────────────────┤
│ id (PK)          │   │   │ id (PK)                      │
│ solicitacao_id   │   │   │ codigo_pdm (UQ)              │
│ tipo │ titulo    │   │   │ descricao                    │
│ url │ metadados  │   │   │ solicitacao_desenvolvimento  │
│ nome_arquivo     │   │   │   _id (FK→solicitacoes)      │
│ tamanho │ mime   │   │   │ status                       │
│ criado_por (FK)  │   │   │ ficha_tecnica (JSONB)        │
└──────────────────┘   │   │ links (JSONB) │ ativo         │
                       │   │ id_integracao_erp_cru         │
                       │   │ id_integracao                 │
                       │   │ criado_por (FK→usuarios)      │
                       │   │ created_at │ updated_at        │
                       │   └──────────────┬────────────────┘
                       │                  │
                       │     ┌────────────┼────────────────────────────┐
                       │     │            │                            │
                       │     ▼            ▼                            ▼
                       │   ┌─────────────────────┐   ┌──────────────────────────────┐
                       │   │produto_cru_         │   │  produto_cru_estrutura        │
                       │   │composicao           │   ├──────────────────────────────┤
                       │   ├─────────────────────┤   │ id (PK)                      │
                       │   │ id (PK)             │   │ produto_cru_id (FK)          │
                       │   │ produto_cru_id (FK) │   │ tipo (URDUME/TRAMA)          │
                       │   │ material            │   │ fio_id (FK→fios)             │
                       │   │ percentual          │   │ base_urdume_id (FK→bases)    │
                       │   └─────────────────────┘   │ ordem                        │
                       │                            └──────────────────────────────┘
                       │
                  ┌────┴───────────────────────────────────────────────────────────┐
                  ▼                                                                │
┌──────────────────────────────────────────────────┐                              │
│              produto_cru_amostra                  │                              │
├──────────────────────────────────────────────────┤                              │
│ id (PK) │ produto_cru_id (FK)                    │                              │
│ descricao │ status │ motivo_aprovacao             │                              │
│ observacoes │ quantidade_produzida                │                              │
│ id_integracao_erp_cru │ links (JSONB)             │                              │
│ historico (JSONB) │ dados (JSONB) │ data          │                              │
│ created_at                                         │                              │
└──────────────────────────────────────────────────┘                              │
                                                                                   │
                  ┌────────────────────────────────────────────────────────────────┘
                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       produto_cru_acabamento                              │
├──────────────────────────────────────────────────────────────────────────┤
│ id (PK) │ produto_cru_id (FK→produtos_cru)                               │
│ tipo_acabamento │ descricao                                              │
│ id_integracao_erp_acabado │ possui_receita                                │
└──────────────────────────┬───────────────────────────────────────────────┘
          1:N              │                   1:N
           │               │                     │
           ▼               │                     ▼
┌────────────────────────┐ │   ┌─────────────────────────────────────────────┐
│produto_cru_acabamento_ │ │   │   produto_cru_acabamento_receita             │
│amostra                 │ │   ├─────────────────────────────────────────────┤
├────────────────────────┤ │   │ id (PK)                                    │
│ id (PK)                │ │   │ acabamento_id (FK)                         │
│ acabamento_id (FK)     │ │   │ tipo_receita                               │
│ descricao │ status     │ │   │ parametros (JSONB)                         │
│ motivo_aprovacao       │ │   └─────────────────────────────────────────────┘
│ observacoes            │ │
│ quantidade_produzida   │ │
│ links (JSONB)          │ │
│ historico (JSONB)      │ │
│ dados (JSONB) │ data   │ │
│ created_at              │ │
└────────────────────────┘ │
                           │
                           ▼
              ┌────────────────────────────────┐
              │   produto_cru_receita          │
              ├────────────────────────────────┤
              │ id (PK)                       │
              │ amostra_id (FK→amostra)       │
              │ descricao │ instrucoes        │
              │ versao │ receita_original_id  │
              │ created_at │ updated_at        │
              └──────────────┬─────────────────┘
                             │ 1:N
                             ▼
              ┌────────────────────────────────┐
              │ produto_cru_receita_item       │
              ├────────────────────────────────┤
              │ id (PK)                       │
              │ receita_id (FK)               │
              │ quimico_id (FK→prod_quimicos) │
              │ descricao │ unidade            │
              │ quantidade_metro │ estagio     │
              │ ordem                         │
              └────────────────────────────────┘
```

### 5.3 🧵 Cadastro Técnico

```
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│       fios           │    │    fornecedores       │    │   fios_fornecedores  │
├──────────────────────┤    ├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │    │ id (PK)              │
│ codigo_completo (UQ) │──┐ │ nome │ cnpj           │┌──│ fio_id (FK)          │
│ codigo_fio (UQ)      │  │ │ razao_social         ││  │ fornecedor_id (FK)  │
│ nome │ composicao    │  │ │ email │ telefone      ││  │ codigo_fornecedor   │
│ titulo │ titulagem   │  │ │ contato │ endereço    ││  │ valor_unitario      │
│ ncm │ torcao         │  │ │ cidade │ uf           ││  │ observacoes         │
│ resistencia          │  │ │ ativo │ id_integracao ││  └──────────────────────┘
│ alongamento          │  │ └──────────────────────┘│
│ links (JSONB)        │  └──────────────────────────┘
│ observacoes │ ativo  │
│ id_integracao        │
│ criado_por (FK)      │
└──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   bases_urdume       │    │  base_urdume_fios     │    │      estampas        │
├──────────────────────┤    ├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │──┐ │ id (PK)              │    │ id (PK)              │
│ codigo_completo (UQ) │  └─│ base_urdume_id (FK)  │    │ codigo_desenho       │
│ codigo_base (UQ)     │    │ fio_id (FK)           │    │ variante             │
│ nome │ descricao     │    │ created_at            │    │ nome │ tipo          │
│ densidade │ tratamento│    └──────────────────────┘    │ imagem_url │ ativo   │
│ tensao_urdume        │                                 │ id_integracao        │
│ largura              │                                 └──────────────────────┘
└──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   cores_solidas      │    │    cores_fundo        │    │   acabamentos        │
├──────────────────────┤    ├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │    │ id (PK)              │
│ codigo (UQ)          │    │ codigo (UQ)          │    │ nome                 │
│ nome │ pantone       │    │ nome │ descricao     │    │ descricao            │
│ familia │ ativo       │    │ ativo                │    │ categoria            │
│ id_integracao        │    │ id_integracao        │    │ ativo                │
└──────────────────────┘    └──────────────────────┘    │ id_integracao        │
                                                        └──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│      maquinas        │    │     operacoes         │    │  produtos_quimicos   │
├──────────────────────┤    ├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │    │ id (PK)              │
│ codigo (UQ)          │    │ codigo (UQ)          │    │ codigo (UQ)          │
│ nome │ tipo          │    │ nome │ tipo          │    │ nome                 │
│ velocidade_maxima    │    │ descricao │ ativo     │    │ descricao            │
│ capacidade_carga     │    │ id_integracao        │    │ categoria            │
│ disponivel │ ativo    │    └──────────────────────┘    │ unidade_padrao       │
│ id_integracao        │                                 │ tipo │ concentracao  │
└──────────────────────┘                                 │ densidade │ ph       │
                                                         │ observacoes          │
                                                         │ ficha_seguranca      │
                                                         │ id_integracao        │
                                                         │ ativo │ criado_por   │
                                                         └──────────────────────┘
```

### 5.4 💬 Comunicação

```
┌──────────────────────┐    ┌──────────────────────────┐
│       chats          │    │    chat_participantes      │
├──────────────────────┤    ├──────────────────────────┤
│ id (PK)              │──┐ │ id (PK)                  │
│ tipo (LIVRE/VINC.)   │  └─│ chat_id (FK)             │
│ titulo               │    │ usuario_id (FK→usuarios)  │
│ entidade_tipo        │    │ adicionado_em             │
│ entidade_id          │    │ ultima_mensagem_lida_id  │
│ criado_por (FK)      │    └──────────────────────────┘
│ updated_at           │
│ created_at           │──┐
└──────────────────────┘  │  ┌──────────────────────────┐
                          │  │     chat_mensagens        │
                          ├──├──────────────────────────┤
                          │  │ id (PK)                  │
                          │  │ chat_id (FK)              │
                          │  │ remetente_id (FK)         │
                          │  │ mensagem                  │
                          │  │ created_at                │
                          │  └────────────┬─────────────┘
                          │               │ 1:N
                          │               ▼
                          │  ┌──────────────────────────┐
                          │  │      chat_leituras        │
                          └──├──────────────────────────┤
                             │ id (PK)                  │
                             │ mensagem_id (FK)         │
                             │ usuario_id (FK)          │
                             │ lida_em                   │
                             └──────────────────────────┘

┌──────────────────────┐    ┌──────────────────────────┐
│    notificacoes       │    │   notificacao_regras      │
├──────────────────────┤    ├──────────────────────────┤
│ id (PK)              │    │ id (PK)                  │
│ tipo                  │    │ tipo (UQ)                │
│ mensagem              │    │ roles (JSONB)            │
│ usuario_id (FK)       │    │ created_at               │
│ usuario_nome          │    └──────────────────────────┘
│ link                  │
│ lida │ lida_em        │
│ created_at             │
└──────────────────────┘
```

### 5.5 📦 Documentos e Romaneios

```
┌─────────────────────────────────────────────────────┐
│                     romaneios                        │
├─────────────────────────────────────────────────────┤
│ id (PK) │ romaneio (UQ) │ pedido │ cnpj              │
│ nome_cliente │ fantasia │ cidade │ uf                │
│ nome_representante │ nome_regiao                      │
│ situacao │ emissao │ entrega │ chegada │ periodo     │
│ linha │ grupo │ sub                                   │
│ total_pecas │ total_metragem                          │
│ total_peso_bruto │ total_peso_liquido                 │
│ id_integracao │ created_at │ updated_at                │
└──────────────────────┬──────────────────────────────┘
                       │ 1:N
                       ▼
┌─────────────────────────────────────────────────────┐
│                    romaneio_pecas                    │
├─────────────────────────────────────────────────────┤
│ id (PK) │ romaneio_id (FK) │ codigo_rolo            │
│ produto │ narrativa │ lote │ lote_produto           │
│ quantidade │ peso_bruto │ peso_liquido              │
│ data_entrada │ op │ nome_operador                   │
│ largura │ gramatura │ endereco_rolo                 │
│ nuance │ qualidade │ pontuacao │ cor                │
│ vendido │ saldo │ unitario │ valor_vendido          │
│ created_at                                           │
└─────────────────────────────────────────────────────┘
```

### 5.6 ⚙️ Administração

```
┌──────────────────────┐    ┌──────────────────────┐
│     config_empresa   │    │    email_config       │
├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │
│ nome │ documento     │    │ host │ port          │
│ endereco │ cidade     │    │ user │ pass (encr.)  │
│ uf │ telefone        │    │ from_name │ ativo     │
│ email │ logo_url     │    └──────────────────────┘
│ is_default           │
└──────────────────────┘    ┌──────────────────────┐
                            │    integracoes        │
┌──────────────────────┐    ├──────────────────────┤
│    bancos_dados       │    │ id (PK)              │
├──────────────────────┤    │ nome │ base_url       │
│ id (PK)              │    │ tipo_auth             │
│ nome                 │    │ auth_config (JSON)    │
│ connection_string    │    │ telas (JSON)          │
│ ativo                │    │ mapping (JSON)        │
└──────────────────────┘    │ ativo                 │
                            └──────────────────────┘
┌──────────────────────┐    ┌──────────────────────┐
│      status          │    │   user_menus          │
├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │
│ nome + tipo (UQ)     │    │ usuario_id (FK)      │
│ rotulo │ cor         │    │ role                 │
│ ordem │ ativo         │    │ titulo │ icone       │
│ created_at            │    │ ordem │ ativo        │
└──────────────────────┘    └─────────┬────────────┘
                                      │ 1:N
                                      ▼
                            ┌──────────────────────┐
                            │   user_menu_itens     │
                            ├──────────────────────┤
                            │ id (PK)              │
                            │ user_menu_id (FK)    │
                            │ titulo │ url         │
                            │ ordem │ ativo         │
                            └──────────────────────┘
┌──────────────────────┐    ┌──────────────────────┐
│      logs            │    │   email_listas        │
├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │
│ tipo │ acao          │    │ nome │ descricao     │
│ descricao            │    └─────────┬────────────┘
│ entidade │ entidade_id│             │ 1:N
│ dados (JSONB)        │             ▼
│ erro                 │    ┌──────────────────────┐
│ usuario_id (FK)      │    │email_lista_contatos  │
│ usuario_nome         │    ├──────────────────────┤
│ created_at            │    │ id (PK)              │
└──────────────────────┘    │ lista_id (FK)        │
                            │ nome │ email         │
┌──────────────────────┐    └──────────────────────┘
│   email_modelos      │
├──────────────────────┤    ┌──────────────────────┐
│ id (PK)              │    │ requisicoes_corte     │
│ nome │ assunto      │    ├──────────────────────┤
│ html                 │    │ id (PK)              │
└──────────────────────┘    │ requisitante_id (FK)  │
                            │ status │ observacoes  │
┌──────────────────────┐    │ entregue_por          │
│ requisicoes_amostra_ │    └─────────┬────────────┘
│ comercial            │              │ 1:N
├──────────────────────┤              ▼
│ id (PK)              │    ┌──────────────────────┐
│ status               │    │req_corte_itens       │
│ solicitante_id (FK)  │    ├──────────────────────┤
│ responsavel_id (FK)  │    │ id (PK)              │
│ cliente              │    │ requisicao_corte_id  │
│ produto_cru_id (FK)  │    │ codigo_produto       │
│ solicitacao_desenv.. │    │ ordem │ artigo       │
│ titulo │ quantidade  │    │ cor │ desenho        │
│ motivo │ observacoes │    │ quantidade           │
│ historico (JSONB)    │    └──────────────────────┘
│ prazo_desejado       │
│ id_integracao        │
│ criado_por (FK)      │
└──────────────────────┘
```

### 5.7 Mapa de Relacionamentos (Resumo)

| Tabela | Relacionamentos |
|--------|----------------|
| `usuarios` | → sessions, solicitacoes (solicitante/responsavel), anexos, fios (criado_por), produtos_cru (criado_por), chats (criado_por), chat_participantes, chat_mensagens, notificacoes, logs, roles |
| `roles` | → usuarios (via role field), notificacao_regras (via JSON), user_menus |
| `solicitacoes` | → anexos, produtos_cru, requisicoes_amostra_comercial |
| `produtos_cru` | → produto_cru_composicao, produto_cru_estrutura, produto_cru_amostra, produto_cru_acabamento, fios, bases_urdume, usuarios |
| `produto_cru_acabamento` | → produto_cru_acabamento_amostra, produto_cru_acabamento_receita |
| `produto_cru_acabamento_amostra` | → produto_cru_receita |
| `fios` | → fios_fornecedores, produto_cru_estrutura, base_urdume_fios |
| `fornecedores` | → fios_fornecedores |
| `bases_urdume` | → base_urdume_fios, produto_cru_estrutura |
| `chats` | → chat_mensagens, chat_participantes |
| `chat_mensagens` | → chat_leituras |
| `romaneios` | → romaneio_pecas |

---

## 6. Regras de Negócio Detalhadas

### 6.1 Solicitação de Desenvolvimento

**Campos do Briefing** (armazenado como JSONB):
- Dados do Cliente
- Tipo de Produto (Tecelagem/Beneficiamento)
- Características Técnicas
- Prazo Desejado
- Observações

**Regras:**
1. Uma solicitação pode gerar **múltiplos produtos** (produtos_cru)
2. O histórico de comunicação é armazenado em JSONB array
3. Ao mudar status, registra no histórico (quem, quando, de/para, motivo)
4. Anexos são armazenados no Vercel Blob, referenciados por URL
5. Links externos (YouTube, Sheets, Docs) são armazenados em JSONB

### 6.2 Produto Cru (Ficha Técnica)

**Regras de Negócio:**
1. `codigo_pdm` é único — identificador do produto no sistema
2. `status` independente da solicitação (DESENVOLVIMENTO, APROVADO, EM_PRODUCAO, OBSOLETO)
3. Composição: lista de materiais com percentuais (deve somar ~100%)
4. Estrutura: dividida em URDUME e TRAMA, cada uma referenciando fios ou bases de urdume
5. Amostras de tecido cru: vinculadas diretamente ao produto
6. Acabamentos: cada produto pode ter múltiplos acabamentos
7. Amostras de acabamento: vinculadas ao acabamento (não ao produto diretamente)
8. Receitas: vinculadas a amostras de acabamento (não ao acabamento)

### 6.3 Amostras — Regras de Transição de Status

**Fluxo de Amostra (Tecido Cru e Acabamento):**

```
PENDENTE → EM_PRODUCAO_TEC (ou EM_PRODUCAO_BEN) → APROVADA_DESENVOLVIMENTO
                                                      ↓
                                              APROVADO_COMERCIAL
                                                      ↓
                                              REPROVADA → PENDENTE (volta)
```

**Regras Críticas:**

1. **Aprovação/Reprovação exige motivo obrigatório**
2. **Ao aprovar**: notifica os responsáveis com link direto (`/cadastros/produto-cru/[id]?tab=amostras&amostraId=amostra-[id]`)
3. **Ao mover para EM_PRODUCAO_TEC ou EM_PRODUCAO_BEN**:
   - Busca o produto cru vinculado
   - Se a solicitação de desenvolvimento estiver em `EM_DESENVOLVIMENTO`, avança automaticamente para `PILOTAGEM`
   - Notifica os responsáveis
4. **Ao reprovar** (estando em produção):
   - Solicitação vinculada volta para `EM_DESENVOLVIMENTO`
   - Notifica os responsáveis
5. **Amostras são resetadas** conforme a solicitação avança/retrocede

### 6.4 Solicitação — Sincronização com Amostras

Quando a solicitação muda de status (`/api/solicitacoes/[id]/status`):

| Status Novo | Ação nas Amostras |
|-------------|-------------------|
| PENDENTE | Amostras em produção → PENDENTE |
| EM_DESENVOLVIMENTO | Amostras em produção → PENDENTE |
| CONCLUIDO_DEV | Amostras em produção → APROVADO_DESENVOLVIMENTO |
| APROVADO_CLI | Amostras aprovadas_dev → APROVADO_COMERCIAL |

### 6.5 Chat Corporativo

**Tipos de Chat:**
- **LIVRE**: chat avulso entre usuários
- **VINCULADO**: vinculado a uma entidade (solicitação, produto)

**Regras:**
1. @mention: `@NomeDoUsuario` → notificação in-app + e-mail com link `/chat?chatId=X`
2. Autocomplete de @: busca em todos os usuários ativos (`/api/usuarios/ativos`)
3. Editar mensagem: apenas próprio autor, dentro de 5 minutos
4. Apagar mensagem: apenas próprio autor, dentro de 5 minutos (com confirm())
5. Leitura: registrada em `chat_leituras` por mensagem
6. Badge de não lidas: calculado por `ultima_mensagem_lida_id` em `chat_participantes`

### 6.6 Requisições de Corte

1. Status: SOLICITADO, EM_PRODUCAO, FINALIZADO, CANCELADO (configurável)
2. Itens: código_produto, ordem, artigo, cor, desenho, quantidade
3. Geração de PDF da requisição

### 6.7 Requisições de Amostra Comercial

1. Vinculada a um produto cru (obrigatório)
2. Status configurável via tabela `status`
3. Kanban para acompanhamento
4. Geração de PDF

### 6.8 Romaneios de Expedição

1. Dados importados via integração com ERP
2. Agrupamento por lote com subtotais
3. Grade de rolos: metragem, peso bruto/líquido, largura, endereço
4. Geração de PDF em formato retrato ou paisagem

---

## 7. Fluxo de Status (Máquina de Estados)

### 7.1 Status de Solicitação de Desenvolvimento

```
                           ┌─────────────┐
                           │  PENDENTE   │
                           └──────┬──────┘
                                  │ Iniciar Desenvolvimento
                                  ▼
                        ┌──────────────────┐
                        │ EM_DESENVOLVIMENTO│
                        └────────┬─────────┘
                                 │ Amostra em produção
                                 ▼
                        ┌──────────────────┐
                        │   PILOTAGEM      │
                        └────────┬─────────┘
                                 │ Concluído Desenvolvimento
                                 ▼
                        ┌──────────────────┐
                        │ CONCLUIDO_DEV    │
                        └────────┬─────────┘
                                 │ Aprovado pelo Cliente
                                 ▼
                        ┌──────────────────┐
                        │ APROVADO_CLI     │
                        └──────────────────┘

Também pode ir para:
  - CANCELADO (a qualquer momento)
  - CONCLUIDO (final alternativo)
```

### 7.2 Status de Amostra (Tecido Cru)

```
                ┌──────────────┐
                │  PENDENTE    │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────────┐
                │ EM_PRODUCAO_TEC  │────→ Solicitação → PILOTAGEM
                └────────┬─────────┘
                         │
                         ├────────────────┐
                         ▼                ▼
                ┌──────────────────┐  ┌──────────┐
                │APROVADO_         │  │REPROVADA │
                │DESENVOLVIMENTO  │  └────┬─────┘
                └────────┬─────────┘      │
                         │                ▼
                         │         Solicitação →
                         │         EM_DESENVOLVIMENTO
                         ▼
                ┌──────────────────┐
                │APROVADO_         │
                │COMERCIAL        │
                └──────────────────┘
```

### 7.3 Status de Amostra (Acabamento)

```
Mesmo fluxo do Tecido Cru, mas usando:
  EM_PRODUCAO_BEN (em vez de EM_PRODUCAO_TEC)
```

### 7.4 Status de Produto Cru

```
DESENVOLVIMENTO → APROVADO → EM_PRODUCAO → OBSOLETO
```

---

## 8. Sistema de Autenticação e Permissões

### 8.1 Autenticação

**NextAuth.js** com:
- **Provider**: Credentials (email + senha)
- **Hash**: bcryptjs
- **Sessão**: JWT (30 dias)
- **Adapter**: Drizzle (tabela `sessions`)

### 8.2 Controle de Acesso

**Níveis:**
- **Middleware** (`src/middleware.ts`): protege rotas por autenticação (qualquer token válido)
- **requireAuth()**: usado em API Routes, retorna `{ session, userId }` ou 401
- **Roles**: ADMIN, COMERCIAL, TECELAGEM, BENEFICIAMENTO, PCP, SUDO, QUALIDADE, DESENVOLVIMENTO
- **Permissões CRUD**: armazenadas em JSONB na tabela `roles.permissions`
- **Menus por perfil**: tabela `user_menus` com itens, configuráveis pelo admin
- **Página inicial**: configurável por usuário e por role

### 8.3 Proteção de Rotas

**Middleware** protege:
```
/dashboard, /dashboard/*
/documentos, /documentos/*
/comercial/*
/tecelagem/*
/beneficiamento/*
/api/solicitacoes/*
```

**API Routes** chamam `requireAuth()` individualmente.

---

## 9. Sistema de Notificações e E-mail

### 9.1 Arquitetura

```
Evento (status change, @mention, etc.)
       ↓
notificar(tipo, mensagem, link, usuarioNome)
       ↓
1. Busca TODOS os usuários ativos
2. Filtra por roles (regra em notificacao_regras)
3. Insere registros em notificacoes (in-app)
4. Envia e-mail via Nodemailer (SMTP configurado)
```

### 9.2 Tipos de Notificação

| Tipo | Quando |
|------|--------|
| SOLICITACAO_APROVADA | Solicitação aprovada pelo cliente |
| SOLICITACAO_ATUALIZADA | Solicitação mudou de status |
| AMOSTRA_APROVADA | Amostra aprovada |
| AMOSTRA_REPROVADA | Amostra reprovada |
| CHAT_MENCAO | Usuário mencionado com @ |
| ERRO_SISTEMA | Erro interno (apenas SUDO) |
| DELECAO | Registro excluído (apenas SUDO) |

### 9.3 Configuração SMTP

Tabela `email_config`:
- host, port, user, pass (criptografada AES-256-GCM)
- from_name

Falback: se `NEXT_PUBLIC_APP_URL` não estiver configurada, usa localhost ou vercel.app.

### 9.4 Template de E-mail

HTML inline com:
- Logo/header "PDM Têxtil"
- Mensagem
- Botão "Ver detalhes" (link direto)
- Footer automático

---

## 10. Sistema de Integração com APIs Externas

### 10.1 Estrutura

Tabela `integracoes`:
- `base_url`: endpoint base da API externa
- `tipo_auth`: bearer, basic, api_key
- `auth_config`: JSON com configuração de autenticação
- `telas`: JSON array de quais telas usar a integração
- `mapping`: JSON de mapeamento de campos

### 10.2 Tipos de Integração

1. **Importação de Clientes** → API ERP → `/api/clientes/importar-api`
2. **Importação em lote** → CSV/planilha (componentes `Importar*`)
3. **Romaneios** → consulta via integração ERP
4. **Proxy de imagens** → `/api/proxy-image`

### 10.3 Criptografia

Senhas/configurações sensíveis são criptografadas com **AES-256-GCM**:
- Chave derivada de `ENCRYPTION_KEY` via SHA-256
- IV aleatório + auth tag armazenados junto com o ciphertext
- Formato: `iv:authTag:encrypted`

---

## 11. Chat Corporativo

### 11.1 Estrutura

```
chats → chat_mensagens → chat_leituras
     → chat_participantes
```

### 11.2 Funcionalidades

- **Criar chat**: livre ou vinculado a entidade (solicitação, produto)
- **Enviar mensagem**: com suporte a emojis (emoji-picker)
- **@mention**: autocomplete com todos os usuários ativos
  - Regex: `@(\w[\wÀ-ÿ\s]*\w|\w)` (suporta acentos)
  - Inserção: `@Nome ` na posição do cursor
  - Navegação: ArrowUp/ArrowDown, Enter/Tab, Escape
  - Highlight visual nas bolhas
- **Editar mensagem**: PATCH `/api/chats/[id]/mensagens/[msgId]`
  - Verifica ownership (remetenteId === userId)
  - Janela de 5 minutos
- **Apagar mensagem**: DELETE `/api/chats/[id]/mensagens/[msgId]`
  - Verifica ownership + janela de 5 minutos
- **Indicador de leitura**: duplo check (✓✓) quando todos leram
- **Badge de não lidas**: no header
- **Notificação**: ao mencionar, cria notificação + e-mail

### 11.3 API de Chat

| Endpoint | Descrição |
|----------|-----------|
| GET /api/chats | Listar chats do usuário |
| POST /api/chats | Criar chat |
| GET /api/chats/[id] | Detalhe do chat + participantes |
| GET /api/chats/[id]/mensagens | Mensagens do chat |
| POST /api/chats/[id]/mensagens | Enviar mensagem (+ @mention) |
| PATCH /api/chats/[id]/mensagens/[msgId] | Editar mensagem |
| DELETE /api/chats/[id]/mensagens/[msgId] | Apagar mensagem |
| POST /api/chats/[id]/ler | Marcar como lido |
| GET /api/chats/entidade | Buscar chat por entidade |
| GET /api/chats/nao-lidas | Contagem de não lidas |
| GET /api/usuarios/ativos | Listar usuários para @mention |

---

## 12. Referência da API REST

### 12.1 Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | /api/admin/usuarios | CRUD usuários |
| GET/PUT/DELETE | /api/admin/usuarios/[id] | CRUD usuário |
| GET/POST | /api/admin/roles | CRUD perfis |
| GET/PUT/DELETE | /api/admin/roles/[id] | CRUD perfil |
| GET/PUT | /api/admin/status | Gerenciar status |
| GET/PUT | /api/admin/permissoes | Gerenciar permissões |
| GET/PUT | /api/admin/config/empresa | Config empresa |
| GET/PUT | /api/admin/config/smtp | Config SMTP |
| POST | /api/admin/config/email-teste | Testar e-mail |
| GET/PUT | /api/admin/pagina-inicial | Página inicial |
| GET/POST/PUT/DELETE | /api/admin/menus | CRUD menus |
| GET/POST/PUT/DELETE | /api/admin/menus/[id]/itens | Itens de menu |
| GET/POST/PUT/DELETE | /api/admin/integracoes | CRUD integrações |
| GET/POST | /api/admin/notificacao-regras | Regras de notificação |
| GET/POST | /api/admin/email-massa/listas | Listas de e-mail |
| GET/POST | /api/admin/email-massa/modelos | Modelos de e-mail |

### 12.2 Solicitações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | /api/solicitacoes | Listar/criar |
| GET/PUT | /api/solicitacoes/[id] | Detalhe/editar |
| PATCH | /api/solicitacoes/[id]/status | Mudar status (+ sinc amostras) |
| GET/POST/PUT/DELETE | /api/solicitacoes/[id]/produtos-cru | Produtos vinculados |

### 12.3 Amostras

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/amostras | Listar todas (tecido_cru + acabamento) |
| PATCH | /api/amostras/status | Mudar status (+ auto-advance solicitação) |

### 12.4 Produto Cru

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | /api/cadastros/produto-cru | Listar/criar |
| GET/PUT | /api/cadastros/produto-cru/[id] | Detalhe/editar |
| GET/POST | /api/cadastros/produto-cru/[id]/composicao | Composição |
| PUT/DELETE | /api/cadastros/produto-cru/[id]/composicao/[cid] | Item composição |
| GET/POST | /api/cadastros/produto-cru/[id]/estrutura | Estrutura |
| PUT/DELETE | /api/cadastros/produto-cru/[id]/estrutura/[eid] | Item estrutura |
| GET/POST | /api/cadastros/produto-cru/[id]/amostras | Amostras tecido cru |
| GET/PUT/DELETE | /api/cadastros/produto-cru/[id]/amostras/[aid] | Amostra tecido cru |
| GET/POST | /api/cadastros/produto-cru/[id]/acabamentos | Acabamentos |
| GET/PUT/DELETE | /api/cadastros/produto-cru/[id]/acabamentos/[aid] | Acabamento |
| GET/POST | /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras | Amostras acabamento |
| PUT/DELETE | /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras/[asid] | Amostra acabamento |
| GET/POST | /api/cadastros/produto-cru/[id]/acabamentos/[aid]/receitas | Receitas |
| GET/PUT/DELETE | /api/cadastros/produto-cru/[id]/acabamentos/[aid]/receitas/[rid] | Receita |

### 12.5 Cadastros (CRUD Padrão)

| Módulo | Rotas |
|--------|-------|
| Clientes | GET/POST /api/cadastros/clientes, GET/PUT/DELETE /api/cadastros/clientes/[id], /modelo, /importar |
| Fios | GET/POST /api/cadastros/fios, GET/PUT/DELETE /api/cadastros/fios/[id], /modelo, /importar |
| Fornecedores | GET/POST /api/cadastros/fornecedores, GET/PUT/DELETE /api/cadastros/fornecedores/[id], /modelo, /importar |
| Cores | GET/POST /api/cadastros/cores, GET/PUT/DELETE /api/cadastros/cores/[id], /modelo, /importar |
| Estampas | GET/POST /api/cadastros/estampas, GET/PUT/DELETE /api/cadastros/estampas/[id], /modelo, /importar |
| Bases Urdume | GET/POST /api/cadastros/bases-urdume, GET/PUT/DELETE /api/cadastros/bases-urdume/[id], /modelo, /importar |
| Prod. Químicos | GET/POST /api/cadastros/produtos-quimicos, GET/PUT/DELETE /api/cadastros/produtos-quimicos/[id], /import |

### 12.6 Dashboard e Relatórios

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/dashboard/stats | Cards e gráficos |
| GET | /api/dashboard/atividades | Atividades recentes |
| GET | /api/dashboard/solicitacoes-lista | Lista solicitações |
| GET | /api/dashboard/amostras-stats | Stats amostras |
| GET | /api/dashboard/amostras-lista | Lista amostras |
| GET | /api/dashboard/amostra-comercial-stats | Stats comercial |
| GET | /api/dashboard/requisicoes-corte-stats | Stats corte |
| GET | /api/dashboard/requisicoes-corte-lista | Lista corte |
| GET | /api/relatorios/solicitacoes-criadas | Relatório |
| GET | /api/relatorios/solicitacoes-por-status | Relatório |
| GET | /api/relatorios/solicitacoes-concluidas | Relatório |
| GET | /api/relatorios/historico-solicitacao | Relatório |
| GET | /api/relatorios/amostras-por-status | Relatório |
| GET | /api/relatorios/amostra-comercial-por-status | Relatório |
| GET | /api/relatorios/historico-amostra | Relatório |
| GET | /api/relatorios/tempo-status | Relatório |
| GET | /api/relatorios/tempo-status-amostras | Relatório |
| GET | /api/relatorios/atividade-usuario | Relatório |

### 12.7 Documentos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/clientes | Listar clientes |
| GET | /api/clientes/[id]/solicitacoes | Solicitações do cliente |
| GET | /api/clientes/[id]/amostras | Amostras do cliente |

---

## 13. Padrões de Código e Convenções

### 13.1 Estrutura de Arquivos

```
src/app/(dashboard)/[modulo]/
  ├── page.tsx           # Lista / Hub
  ├── [id]/page.tsx      # Detalhe
  ├── novo/page.tsx      # Criação
  └── editar/page.tsx    # Edição (quando diferente de detalhe)
```

### 13.2 API Routes

Todas seguem o mesmo padrão:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // ... lógica

    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/...]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
```

### 13.3 Convenções

- **Client Components**: prefixo `"use client"` apenas quando necessário (estado, efeitos, eventos)
- **Imports**: organizados (React, bibliotecas, componentes, lib)
- **Estados**: useState + useEffect para dados; TanStack Query para cache
- **Formulários**: React Hook Form + Zod para validação
- **Toast**: Sonner (`toast.success()`, `toast.error()`)
- **Tipagem**: Drizzle `$inferSelect` / `$inferInsert` para schemas
- **Status configuráveis**: lidos da tabela `status` via `useStatuses` hook / `getValidStatuses()` server-side
- **Links**: campo `links` como JSONB array `{ url, descricao }[]` em várias tabelas
- **Integração**: campo `id_integracao` varchar em todas as tabelas sincronizáveis
- **Auditoria**: `logs` tabela para todas as ações importantes

### 13.4 Hooks Customizados

| Hook | Descrição |
|------|-----------|
| `useStatuses(tipo)` | Retorna `getLabel(nome)`, `getColor(nome)`, `hexToRgba()` para status configuráveis |

### 13.5 Utilitários Importantes

| Arquivo | Função |
|---------|--------|
| `lib/auth.ts` | `requireAuth()`, `authOptions`, `getUserId()` |
| `lib/notificar.ts` | `notificar()`, `notificarErro()`, `notificarDelecao()` |
| `lib/email.ts` | `sendEmail()`, `getTransporter()`, `parseEmails()` |
| `lib/crypto.ts` | `encrypt()`, `decrypt()` |
| `lib/log.ts` | `registrarLog()` |
| `lib/status-utils.ts` | `getStatusesByTipo()`, `getValidStatuses()`, `getStatusMap()` |
| `lib/error-handler.ts` | Tratamento centralizado de erros |
| `lib/validation.ts` | Schemas Zod compartilhados |
| `lib/db-admin.ts` | Admin de banco de dados (criar, clonar, backup) |

---

## 14. Módulo de Relacionamento Comercial — PDM Commercial Intelligence

> ⚠️ **Decisão Arquitetural**: O CRM não é um módulo separado do PDM.  
> Ele é uma **extensão natural do módulo Comercial**, compartilhando toda a infraestrutura já existente.  
> O PDM já possui aproximadamente **70% de um CRM**: autenticação, permissões, notificações, chat por entidade, integração com ERP, importação, auditoria, status configuráveis, dashboards e APIs padronizadas.  
> O que falta é a **camada de relacionamento comercial** — lead, empresa, contato, oportunidade, visita, timeline.

### 14.1 Visão Geral

**Hoje** o fluxo do PDM começa na solicitação:

```
Solicitação de Desenvolvimento
         ↓
      Produto
         ↓
     Amostras
         ↓
    Produção
```

**O novo fluxo** antecede a solicitação com toda a camada comercial:

```
       Captação (Site, WhatsApp, Indicacão, Evento)
         ↓
        Lead
         ↓
   Qualificação (manual ou IA)
         ↓
  Distribuição (Gerente → Representante)
         ↓
    Oportunidade
         ↓
   Visitas + Propostas + Amostras
         ↓
Solicitação de Desenvolvimento  ←── Ponto de conexão com o PDM atual
         ↓
      Produto
         ↓
     Amostras
         ↓
    Produção
         ↓
    Pós-Venda → Recompra → Reativação por IA
```

A Solicitação deixa de ser o início do processo. Ela passa a ser **uma consequência da venda**.

### 14.2 Arquitetura — A Empresa como Centro

O centro do sistema é a **Empresa**. Tudo gira em torno dela:

```
                              ┌──────────────────┐
                              │    ERP (externo)  │
                              │ Pedidos, Financeiro│
                              └────────┬─────────┘
                                       │ Integração
                                       ▼
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  Leads   │───▶│ Empresa  │◀──▶│   Cliente    │───▶│ Solicitação │───▶│  Produto   │
│(CRM)     │    │ (CRM)   │    │  (ERP/PDM)   │    │             │    │            │
└─────────┘    └────┬─────┘    └──────────────┘    └─────────────┘    └────────────┘
                    │
         ┌─────────┼──────────────────┐
         │         │                  │
         ▼         ▼                  ▼
   ┌────────┐ ┌────────┐      ┌──────────────┐
   │Contatos│ │Oportun.│      │   Timeline   │
   │(CRM)   │ │(CRM)   │      │   (unificada)│
   └────────┘ └────────┘      └──────────────┘
                    │
         ┌─────────┼──────────────────┐
         │         │                  │
         ▼         ▼                  ▼
   ┌──────────┐ ┌────────┐      ┌──────────────┐
   │ Visitas  │ │Tarefas │      │  Propostas   │
   │+ Ata     │ │(CRM)   │      │  (CRM)       │
   └──────────┘ └────────┘      └──────────────┘
```

### 14.3 O que NÃO será criado (reuso total)

| Infraestrutura | Motivo |
|----------------|--------|
| **Chat** | Já existe chat por entidade. Basta criar novos tipos: `CRM_EMPRESA`, `CRM_OPORTUNIDADE`, `CRM_VISITA`, `CRM_LEAD` |
| **Notificações** | Já existe `notificar()`. Novos tipos: `CRM_NOVO_LEAD`, `CRM_OPORTUNIDADE_GANHA`, `CRM_TAREFA_VENCENDO` |
| **Upload (Blob)** | Já existe via Vercel Blob + `AnexosUpload`. Fotos de visita, PDFs, áudios usam o mesmo componente |
| **Status configuráveis** | Tabela `status` com `tipo = CRM_FUNIL`. O funil de vendas é tão configurável quanto os status de solicitação |
| **Permissões** | Roles + permissions JSONB já existentes. Novo perfil: `REPRESENTANTE` |
| **Menus** | Tabela `user_menus` já permite configurar menus por perfil |
| **Auditoria** | Tabela `logs` já registra todas as ações |
| **Dashboard** | Novos widgets no dashboard existente (pipeline, conversão, leads, visitas, previsão, ticket, origem) |
| **Importação** | Componentes `Importar*` já prontos para batch |
| **Integração ERP** | Tabela `integracoes` + `id_integracao` em todas as tabelas |
| **Geração de PDF** | jsPDF + jspdf-autotable já configurados |

### 14.4 MER do CRM (tabelas novas)

```
                    ┌────────────────────────────────────────────┐
                    │              crm_empresas                  │
                    ├────────────────────────────────────────────┤
                    │ id (PK)                                    │
                    │ cnpj (UQ) │ razao_social                   │
                    │ nome_fantasia │ inscricao_estadual         │
                    │ site │ segmento │ porte (ME, EPP, EGP)    │
                    │ endereco │ cidade │ uf │ pais             │
                    │ telefone │ email                           │
                    │ origem (SITE, INDICACAO, WHATSAPP,         │
                    │        EVENTO, LIGACAO, OUTRO)            │
                    │ observacoes                                │
                    │ cliente_id (FK→clientes, nullable)        │
                    │ responsavel_id (FK→usuarios)              │
                    │ regiao_id (FK→crm_regioes)                │
                    │ criado_por (FK→usuarios)                   │
                    │ created_at │ updated_at                    │
                    └────────────────────┬───────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│     crm_contatos       │  │    crm_leads            │  │  crm_oportunidades     │
├────────────────────────┤  ├────────────────────────┤  ├────────────────────────┤
│ id (PK)                │  │ id (PK)                │  │ id (PK)                │
│ empresa_id (FK)        │  │ empresa_id (FK)        │  │ empresa_id (FK)        │
│ nome │ cargo           │  │ contato_nome           │  │ titulo                 │
│ email │ telefone       │  │ contato_telefone       │  │ descricao              │
│ celular │ whatsapp     │  │ contato_email          │  │ valor_estimado         │
│ principal (boolean)    │  │ origem                 │  │ probabilidade          │
│ observacoes            │  │ interesse_produto      │  │ status (CRM_FUNIL)     │
│ created_at              │  │ fonte (SITE,           │  │ fonte                  │
└────────────────────────┘  │       WHATSAPP, ...)  │  │ data_contato_inicial   │
                            │ score (0-100)          │  │ data_prevista_fecha    │
                            │ data_contato           │  │ data_fechamento        │
                            │ data_convertido        │  │ motivo_perda           │
                            │ responsavel_id (FK)    │  │ responsavel_id (FK)    │
                            │ created_at              │  │ contato_id (FK)        │
                            └────────────────────────┘  │ solicitacao_id (FK)    │
                                                        │ created_at │ updated_at│
                                                        └────────────────────────┘

┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│   crm_visitas          │  │   crm_tarefas           │  │   crm_propostas        │
├────────────────────────┤  ├────────────────────────┤  ├────────────────────────┤
│ id (PK)                │  │ id (PK)                │  │ id (PK)                │
│ empresa_id (FK)        │  │ empresa_id (FK)        │  │ oportunidade_id (FK)   │
│ oportunidade_id (FK)   │  │ oportunidade_id (FK)   │  │ empresa_id (FK)        │
│ contato_id (FK)        │  │ titulo                 │  │ valor                  │
│ data_visita            │  │ descricao              │  │ descricao              │
│ tipo (PRESENCIAL,      │  │ tipo (LIGACAO, REUNIAO,│  │ condicoes_pagamento    │
│       VIDEO, TELEFONE) │  │       PROPOSTA, TAREFA)│  │ prazo_entrega          │
│ status (AGENDADA,      │  │ data_prevista          │  │ arquivo_url (Blob)     │
│        REALIZADA,      │  │ data_conclusao         │  │ status (ENVIADA,       │
│        CANCELADA)      │  │ status (PENDENTE,      │  │         ACEITA,        │
│ motivo_cancelamento    │  │         CONCLUIDO)     │  │         RECUSADA,      │
│ relato (ata)           │  │ responsavel_id (FK)    │  │         REVISAO)       │
│ fotos (JSONB urls)     │  │ created_at │ updated_at│  │ data_envio             │
│ documentos (JSONB)     │  └────────────────────────┘  │ data_resposta           │
│ criado_por (FK)        │                              │ created_at │ updated_at│
│ created_at │ updated_at│                              └────────────────────────┘
└────────────────────────┘

┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│   crm_regioes          │  │   crm_equipes           │  │ crm_campanhas          │
├────────────────────────┤  ├────────────────────────┤  ├────────────────────────┤
│ id (PK)                │  │ id (PK)                │  │ id (PK)                │
│ nome │ uf              │  │ nome                   │  │ nome                   │
│ gerente_id (FK→users)  │  │ regiao_id (FK)         │  │ tipo (EMAIL, WHATSAPP, │
│ ativo                  │  │ responsavel_id (FK)    │  │       REDES, EVENTO)   │
│ created_at              │  │ ativo                  │  │ data_inicio            │
└────────────────────────┘  │ created_at              │  │ data_fim               │
                            └────────────────────────┘  │ orcamento              │
                                                        │ leads_gerados          │
┌────────────────────────┐  ┌────────────────────────┐  │ custo_aquisicao        │
│ crm_timeline_eventos   │  │ crm_whatsapp_mensagens │  │ status (ATIVA, PAUSADA,│
├────────────────────────┤  ├────────────────────────┤  │         CONCLUIDA)     │
│ id (PK)                │  │ id (PK)                │  │ created_at │ updated_at│
│ empresa_id (FK)        │  │ empresa_id (FK)        │  └────────────────────────┘
│ tipo (LEAD,            │  │ contato_id (FK)        │
│       OPORTUNIDADE,    │  │ mensagem               │
│       VISITA,          │  │ tipo (RECEBIDA,        │
│       TAREFA,          │  │       ENVIADA)         │
│       PROPOSTA,        │  │ status (PENDENTE,      │
│       SOLICITACAO,     │  │        ENVIADA,        │
│       AMOSTRA,         │  │        RECEBIDA,       │
│       PEDIDO_ERP,      │  │        ERRO)           │
│       ROMANEIO,        │  │ lida (boolean)         │
│       WHATSAPP)        │  │ created_at              │
│ descricao              │  └────────────────────────┘
│ metadados (JSONB)       │
│ data_evento            │
│ created_at              │
└────────────────────────┘
```

### 14.5 Regras de Negócio do CRM

#### 14.5.1 Lead → Empresa

1. Lead chega por qualquer canal (site, WhatsApp, indicação, evento, ligação)
2. Sistema busca CNPJ na tabela `clientes` e `crm_empresas`
   - Se já existe em `clientes` → relaciona lead à empresa existente
   - Se já existe em `crm_empresas` → relaciona lead à empresa existente
   - Se não existe → cria `crm_empresa` com dados extraídos
3. Lead pode ser qualificado manualmente ou por IA (score 0-100)
4. Lead qualificado vira Oportunidade automaticamente ou por ação do usuário
5. Lead não qualificado em 30 dias → notificação para gerente

#### 14.5.2 Empresa → Cliente (sincronização)

1. `crm_empresas` e `clientes` são tabelas separadas por decisão arquitetural
2. Uma empresa CRM pode ser vinculada a zero ou um cliente ERP/PDM
3. Quando uma oportunidade é GANHA:
   - Se `crm_empresa.cliente_id` for nulo → cria registro em `clientes` com dados da empresa
   - Se já existir cliente com o mesmo CNPJ → apenas relaciona
4. Regra de unicidade: **CNPJ é a chave**. Mesmo CNPJ = mesma empresa
5. A tabela `clientes` nunca é editada pelo CRM — apenas lida e populada

#### 14.5.3 Funil de Vendas (Pipeline)

1. Pipeline é configurável via tabela `status` com `tipo = CRM_FUNIL`
2. Status padrão sugeridos: `NOVO`, `QUALIFICADO`, `PROPOSTA_ENVIADA`, `NEGOCIACAO`, `GANHO`, `PERDIDO`
3. Cada estágio tem cor, ordem e pode ser configurado pelo admin
4. Ao mover para `GANHO`:
   - Empresa vira Cliente (se não for)
   - Gera Solicitação de Desenvolvimento pré-preenchida (se houver produto)
   - Registra na timeline
5. Ao mover para `PERDIDO`:
   - Exige `motivo_perda` obrigatório
   - Agenda reativação automática para 90 dias

#### 14.5.4 Hierarquia Comercial

```
Diretoria
    ↓
Gerente Comercial (crm_regioes)
    ↓
Representantes (crm_equipes)
    ↓
Clientes / Leads / Oportunidades
```

1. Toda oportunidade tem um `responsavel_id` (representante)
2. Todo lead ao ser criado é distribuído automaticamente:
   - Identifica região pelo telefone/CEP
   → Busca representante da região
   → Atribui lead ao representante
3. Gerente vê tudo da sua região; Diretoria vê tudo
4. Representante vê apenas seus próprios leads, oportunidades e clientes

#### 14.5.5 Visitas e Atas

1. Visita pode ser agendada a partir de uma oportunidade
2. Tipos: presencial, vídeo, telefone
3. Ao concluir visita:
   - Gera relato (ata) — texto livre
   - Anexa fotos (múltiplas, via Vercel Blob)
   - Anexa documentos
   - Atualiza oportunidade automaticamente
   - Registra na timeline
4. Visita não realizada pode ser cancelada com motivo

#### 14.5.6 Timeline Única

A timeline é o grande diferencial competitivo. Uma única tela mostra toda a história da empresa:

```
18/06  Lead criado pelo site.
       ↓
18/06  IA respondeu WhatsApp.
       ↓
19/06  Representante assumiu.
       ↓
22/06  Visita realizada — Ata criada — Fotos anexadas.
       ↓
25/06  Proposta enviada.
       ↓
28/06  Oportunidade GANHA.
       ↓
28/06  Solicitação de Desenvolvimento #42 criada.
       ↓
05/07  Produto CAD #1089 criado.
       ↓
10/07  Amostra tecido cru enviada.
       ↓
15/07  Amostra aprovada.
       ↓
20/07  Pedido ERP #5874.
       ↓
25/07  Romaneio #1023 — Entrega realizada.
       ↓
30/07  Nova visita pós-venda.
       ↓
05/08  Novo pedido.
```

**Implementação da Timeline:**

```sql
-- Tabela única de eventos (performance)
crm_timeline_eventos (
  id, empresa_id, tipo, descricao, metadados (JSONB),
  data_evento, created_at
)

-- Consulta:
SELECT * FROM crm_timeline_eventos
WHERE empresa_id = ?
ORDER BY data_evento DESC
LIMIT 50
```

Cada módulo do PDM insere eventos na timeline:
| Módulo | Tipo | Onde insere |
|--------|------|-------------|
| CRM Lead | `LEAD` | `crm_timeline_eventos` |
| CRM Oportunidade | `OPORTUNIDADE` | `crm_timeline_eventos` |
| CRM Visita | `VISITA` | `crm_timeline_eventos` |
| CRM Proposta | `PROPOSTA` | `crm_timeline_eventos` |
| CRM Tarefa | `TAREFA` | `crm_timeline_eventos` |
| CRM WhatsApp | `WHATSAPP` | `crm_timeline_eventos` |
| Solicitação | `SOLICITACAO` | `crm_timeline_eventos` (via trigger) |
| Produto Cru | `PRODUTO` | `crm_timeline_eventos` (via trigger) |
| Amostra | `AMOSTRA` | `crm_timeline_eventos` (via trigger) |
| Romaneio | `ROMANEIO` | `crm_timeline_eventos` (via trigger) |

**Trigger Pattern (exemplo para solicitações):**

```typescript
async function inserirTimeline(
  empresaId: number,
  tipo: string,
  descricao: string,
  metadados?: Record<string, unknown>,
  dataEvento?: Date
) {
  await db.insert(crmTimelineEventos).values({
    empresaId,
    tipo,
    descricao,
    metadados: metadados || {},
    dataEvento: dataEvento || new Date(),
  })
}

// Usado em:
// - solicitacoes route (ao criar solicitação vinculada a uma empresa CRM)
// - amostras route (ao criar amostra)
// - etc.
```

### 14.6 Reuso da Infraestrutura Existente

#### 14.6.1 Chat

O chat por entidade já existe. Basta criar chats com `entidadeTipo` = `CRM_EMPRESA`, `CRM_OPORTUNIDADE`, `CRM_VISITA`, `CRM_LEAD`:

```typescript
// Já funciona sem nenhuma alteração no backend de chat:
const chat = await fetch("/api/chats", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    titulo: "Empresa: Tecelagem Silva",
    tipo: "VINCULADO",
    entidadeTipo: "CRM_EMPRESA",
    entidadeId: 42,
  }),
})
```

#### 14.6.2 Notificações

Usar `notificar()` existente com novos tipos:

```typescript
// Novo lead capturado
await notificar("CRM_NOVO_LEAD",
  `Novo lead: ${lead.contatoNome} - ${lead.empresaRazaoSocial}`,
  `/crm/empresas/${empresaId}`,
  session.user.name
)

// Oportunidade ganha
await notificar("CRM_OPORTUNIDADE_GANHA",
  `Oportunidade GANHA: ${oportunidade.titulo} - R$ ${valor}`,
  `/crm/oportunidades/${oportunidadeId}`,
  session.user.name
)

// Tarefa vencendo
await notificar("CRM_TAREFA_VENCENDO",
  `Tarefa vence hoje: ${tarefa.titulo} - ${tarefa.empresaNome}`,
  `/crm/tarefas`,
  session.user.name
)
```

#### 14.6.3 Upload (Blob)

Fotos de visita, PDFs de proposta e áudios de WhatsApp reusam o componente `AnexosUpload` e o armazenamento Vercel Blob já configurado.

#### 14.6.4 Status Configuráveis

O funil de vendas usa a tabela `status` com `tipo = CRM_FUNIL`:

```
status (
  nome: "NOVO",
  rotulo: "Novo Lead",
  tipo: "CRM_FUNIL",
  cor: "#3b82f6",
  ordem: 0
)
status (
  nome: "QUALIFICADO",
  rotulo: "Qualificado",
  tipo: "CRM_FUNIL",
  cor: "#8b5cf6",
  ordem: 1
)
...
```

#### 14.6.5 Dashboard

Novos endpoints de stats em `api/dashboard/`:
- `GET /api/dashboard/crm-pipeline` → contagem por estágio do funil
- `GET /api/dashboard/crm-conversao` → taxa de conversão lead → cliente
- `GET /api/dashboard/crm-previsao` → soma de valores por estágio
- `GET /api/dashboard/crm-atividades` → últimas atividades dos representantes

Widgets no dashboard:
```
Pipeline (barras horizontais)
Conversão (funil)
Leads no mês (linha)
Ticket médio (card)
Oportunidades por representante (pizza)
Previsão de receita (card)
```

### 14.7 IA Comercial — OpenClaw como Funcionário

A IA não é um chatbot externo. Ela **trabalha dentro do PDM** como um funcionário digital:

**Capacidades:**

1. **Classificação de Leads**: ao receber lead do site/WhatsApp, IA identifica:
   - CNPJ (extrai de mensagem ou formulário)
   - Segmento (têxtil, confecção, estamparia)
   - Porte (micro, pequeno, médio, grande)
   - Probabilidade de conversão (0-100)

2. **Resposta Automática no WhatsApp**: IA consulta:
   - CRM (histórico da empresa)
   - ERP (pedidos, financeiro, romaneios)
   - PDM (solicitações, amostras, produtos)
   - → Responde com contexto completo
   - → Agenda visita se identificar interesse
   - → Cria tarefa para o representante

3. **Resumo de Timeline**: ao abrir uma empresa, IA gera:
   ```
   "Última visita: 22/06 (João). Média de 2 pedidos/mês.
   Último pedido: 05/08 (R$ 15.000). Amostra pendente desde 10/07.
   Sugestão: Cobrar aprovação da amostra para gerar novo pedido."
   ```

4. **Reativação Automática**: oportunidades PERDIDAS há 90 dias:
   - IA sugere recontato
   - Gera tarefa para o representante
   - Prepara briefing com histórico

5. **Previsão de Vendas**: baseado em:
   - Oportunidades abertas × probabilidade
   - Histórico de conversão do representante
   - Sazonalidade do segmento

### 14.8 Estrutura de Diretórios do CRM

```
src/
├── app/(dashboard)/comercial/crm/
│   ├── page.tsx                    # Dashboard CRM
│   ├── leads/
│   │   └── page.tsx                # Lista de leads
│   ├── empresas/
│   │   ├── page.tsx                # Lista empresas
│   │   └── [id]/page.tsx           # Detalhe empresa (+ timeline)
│   ├── oportunidades/
│   │   ├── page.tsx                # Pipeline kanban
│   │   └── [id]/page.tsx           # Detalhe oportunidade
│   ├── visitas/
│   │   └── page.tsx                # Agenda de visitas
│   ├── tarefas/
│   │   └── page.tsx                # Minhas tarefas
│   ├── propostas/
│   │   └── page.tsx                # Lista propostas
│   ├── campanhas/
│   │   └── page.tsx                # Campanhas
│   └── relatorios/
│       └── page.tsx                # Relatórios CRM
│
├── app/api/crm/
│   ├── leads/route.ts
│   ├── leads/[id]/route.ts
│   ├── empresas/route.ts
│   ├── empresas/[id]/route.ts
│   ├── oportunidades/route.ts
│   ├── oportunidades/[id]/route.ts
│   ├── oportunidades/status/route.ts
│   ├── visitas/route.ts
│   ├── visitas/[id]/route.ts
│   ├── tarefas/route.ts
│   ├── tarefas/[id]/route.ts
│   ├── propostas/route.ts
│   ├── propostas/[id]/route.ts
│   ├── regioes/route.ts
│   ├── equipes/route.ts
│   ├── timeline/route.ts
│   ├── campanhas/route.ts
│   ├── whatsapp/route.ts
│   └── dashboard/ (pipeline, conversao, previsao)
│
├── components/crm/
│   ├── crm-pipeline-kanban.tsx      # Kanban de oportunidades
│   ├── crm-oportunidade-card.tsx    # Card no pipeline
│   ├── crm-oportunidade-dialog.tsx  # Detalhe/edição
│   ├── crm-empresa-timeline.tsx     # Timeline única
│   ├── crm-timeline-event.tsx       # Item da timeline
│   ├── crm-visita-form.tsx          # Formulário de visita + ata
│   ├── crm-visita-fotos.tsx         # Upload de fotos
│   ├── crm-tarefas-list.tsx         # Lista de tarefas
│   ├── crm-propostas-list.tsx       # Lista de propostas
│   ├── crm-distribuicao-lead.tsx    # Distribuição automática
│   ├── crm-whatsapp-panel.tsx       # Painel WhatsApp
│   └── crm-ia-resumo.tsx           # Resumo gerado por IA
│
├── hooks/
│   └── use-crm-statuses.ts          # Hook para status CRM_FUNIL
│
└── lib/
    └── crm-utils.ts                 # Utilitários CRM (distribuição, etc.)
```

### 14.9 API do CRM

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | /api/crm/leads | Listar/criar leads |
| GET/PUT/DELETE | /api/crm/leads/[id] | Detalhe lead |
| GET/POST | /api/crm/empresas | Listar/criar empresas |
| GET/PUT | /api/crm/empresas/[id] | Detalhe empresa |
| GET/POST | /api/crm/oportunidades | Listar/criar oportunidades |
| GET/PUT | /api/crm/oportunidades/[id] | Detalhe oportunidade |
| PATCH | /api/crm/oportunidades/status | Mudar estágio (+ regras) |
| GET/POST | /api/crm/visitas | Listar/criar visitas |
| GET/PUT | /api/crm/visitas/[id] | Detalhe visita (+ fotos) |
| GET/POST | /api/crm/tarefas | Listar/criar tarefas |
| GET/PUT | /api/crm/tarefas/[id] | Detalhe tarefa |
| GET/POST | /api/crm/propostas | Listar/criar propostas |
| GET/PUT | /api/crm/propostas/[id] | Detalhe proposta (+ PDF) |
| GET/POST | /api/crm/regioes | CRUD regiões |
| GET/POST | /api/crm/equipes | CRUD equipes |
| GET | /api/crm/timeline | Timeline da empresa |
| GET/POST | /api/crm/campanhas | CRUD campanhas |
| GET/POST | /api/crm/whatsapp | Mensagens WhatsApp |
| GET | /api/dashboard/crm-pipeline | Pipeline stats |
| GET | /api/dashboard/crm-conversao | Conversão stats |
| GET | /api/dashboard/crm-previsao | Previsão stats |
| GET | /api/dashboard/crm-atividades | Atividades recentes |

### 14.10 Cronograma de Implementação

| Fase | Duração | Módulo | Tabelas | Entrega |
|------|---------|--------|---------|---------|
| **1** | 2 semanas | Leads + Empresas + Contatos | `crm_leads`, `crm_empresas`, `crm_contatos` | Captação de leads |
| **2** | 2 semanas | Oportunidades + Pipeline Kanban | `crm_oportunidades` | Funil de vendas |
| **3** | 2 semanas | Visitas + Atas + Fotos | `crm_visitas` | Visitas em campo |
| **4** | 1 semana | Tarefas + Agenda | `crm_tarefas` | Produtividade |
| **5** | 2 semanas | Propostas + PDF | `crm_propostas` | Propostas comerciais |
| **6** | 2 semanas | Timeline Única | `crm_timeline_eventos` + triggers | Visão 360° |
| **7** | 1 semana | Regiões + Equipes | `crm_regioes`, `crm_equipes` | Hierarquia comercial |
| **8** | 2 semanas | Sincronização Empresa→Cliente | trigger + regras | Unificação PDM/CRM |
| **9** | 2 semanas | Dashboard CRM | - | Indicadores |
| **10** | 3 semanas | WhatsApp + Campanhas | `crm_whatsapp`, `crm_campanhas` | Automação marketing |
| **11** | 4 semanas | IA Comercial (OpenClaw) | - | Classificação + resumo |
| **12** | 2 semanas | Relatórios + Ajustes finais | - | Lançamento |

**Total estimado: ~23 semanas (~6 meses)**

### 14.11 Diferenciais Competitivos

1. **Timeline única integrada** — do lead ao romaneio numa tela só. Nenhum CRM genérico entrega isso.
2. **IA com contexto industrial** — não é um chatbot genérico. Conhece o PDM, o ERP e a indústria têxtil.
3. **Hierarquia comercial real** — regiões, gerentes, representantes, distribuição automática de leads.
4. **Integração com ERP** — pedidos, financeiro, inadimplência, mix de produtos disponíveis na tela do representante.
5. **Aproveitamento total do PDM** — não é um sistema paralelo. É o mesmo sistema, mesma base, mesma UI.
6. **Funil configurável** — o cliente define os estágios, não o desenvolvedor.

### 14.12 O Produto Final

```
PDM Pro Têxtil
    │
    ├── Comercial
    │   ├── CRM ←── NOVO
    │   ├── Solicitações de Desenvolvimento
    │   ├── Requisições de Amostra Comercial
    │   ├── Clientes (ERP)
    │   └── Campanhas ←── NOVO
    │
    ├── Desenvolvimento (Amostras + Kanban)
    │
    ├── Engenharia (Produtos, Receitas, Cadastros)
    │
    ├── Documentos (Romaneios)
    │
    ├── BI (Dashboards + Relatórios)
    │
    └── Administração
```

O CRM deixa de ser um "apêndice" e passa a ser **a porta de entrada de todo o ciclo de vida do cliente na indústria têxtil**.

---

## Apêndice A: Scripts do Projeto

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Next.js) |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar servidor de produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Executar migrations SQL |
| `npm test` | Vitest (testes unitários) |
| `npm run test:watch` | Vitest em modo watch |

## Apêndice B: Variáveis de Ambiente

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32"
BLOB_READ_WRITE_TOKEN="vercel_blob_token"
ENCRYPTION_KEY="chave-32-caracteres-ou-mais"
NEXT_PUBLIC_APP_URL="https://pdmprotextil.vercel.app"
```

## Apêndice C: Usuários Seed

| Email | Senha | Perfil |
|-------|-------|--------|
| comercial@pdmprotextil.com.br | 123456 | COMERCIAL |
| tecelagem@pdmprotextil.com.br | 123456 | TECELAGEM |
| beneficiamento@pdmprotextil.com.br | 123456 | BENEFICIAMENTO |
| admin@pdmprotextil.com.br | 123456 | ADMIN |

---

> Documentação gerada em Julho/2026 para subsidiar a implementação do módulo CRM.  
> **PDM Pro Têxtil** — Desenvolvido por Pro Moda Têxtil.
