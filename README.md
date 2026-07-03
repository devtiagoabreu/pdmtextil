# PDM Pro Têxtil

![Landing Page](public/landing.png)

> *⚠️ Adicione um print da landing page como `public/landing.png` para exibir aqui.*

Sistema de gestão de desenvolvimento de produtos têxteis (PDM — Product Data Management). Conecta os departamentos **Comercial**, **Desenvolvimento (Tecelagem e Beneficiamento)** e **PCP** em uma plataforma única, eliminando retrabalhos e garantindo rastreabilidade completa do briefing à produção.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-0.45-CBA6F7?logo=drizzle)](https://orm.drizzle.team/)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E5A0?logo=postgresql)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Funcionalidades

### Módulo Comercial
- **Solicitações de Desenvolvimento** — briefing completo dividido em 8 seções (Tecelagem e Beneficiamento), com anexos (PDF, DOCX, XLSX, JPG, PNG, MP4 via Vercel Blob) e links incorporados (YouTube, Google Sheets, Docs, Agenda)
- **Kanban de Solicitações** — arraste e solte para avançar etapas do desenvolvimento
- **Detalhe da Solicitação** — linha do tempo de status, histórico de comunicação, produtos vinculados, chat por entidade
- **Requisições de Amostra Comercial** — solicitação de amostras para clientes com kanban de acompanhamento
- **Requisições de Corte** — requisições com itens, geração de PDF
- **Clientes** — cadastro completo com importação via API externa e modelo de planilha

### Módulo de Amostras (Desenvolvimento)
- **Listagem de Amostras** — tabela com abas Tecido Cru / Acabamento, links diretos para ficha técnica do produto, filtros por status, geração de PDF "Solicitação de Amostra"
- **Kanban de Amostras** — arraste e solte por colunas de status configuráveis
- **Vínculo com Produto** — cada amostra pertence a um produto cru (tecido ou acabamento) com rastreabilidade completa
- **Avanço Automático** — ao mover amostra para "Em Produção" no kanban, a solicitação vinculada avança automaticamente para "Pilotagem"

### Módulo de Cadastros (Engenharia Têxtil)
- **Fios** — cadastro completo: composição, titulagem (Ne, Nm, Tex), NCM, fornecedores vinculados, importação em lote
- **Cores** — cores sólidas e de fundo com código, pantone, família de cor, importação em lote
- **Estampas** — desenhos com variantes e imagens, importação em lote
- **Bases de Urdume** — cadastro com fios associados, importação em lote
- **Fornecedores** — cadastro com importação em lote
- **Acabamentos** — categorizados por tipo (químico, mecânico, lavagem etc.)
- **Máquinas e Operações** — cadastro técnico de máquinas e operações do beneficiamento
- **Produtos Químicos** — cadastro com concentração, densidade, pH, FISPQ, importação em lote
- **Produtos (Tecidos)** — ficha técnica completa do produto cru:
  - Composição (liga de fios com percentuais)
  - Estrutura têxtil (trama, urdume, batidas, gramatura)
  - Amostras de tecido cru (com status, links, motivos, PDF)
  - Acabamentos vinculados (com receitas, amostras de acabamento)
  - Receitas de beneficiamento versionadas
- **Receitas** — receitas de beneficiamento com itens, estágios, produtos químicos, versionamento, duplicação

### Chat Corporativo
- **Chat por Entidade** — conversas vinculadas a solicitações ou produtos
- **Mensagens com @mention** — autocomplete de todos os usuários ativos, com suporte a acentos, destaque visual nas bolhas
- **Notificações** — ao mencionar alguém com `@Nome`, o usuário recebe notificação in-app e e-mail com link direto para a conversa
- **Editar / Apagar** — própria mensagem dentro da janela de 5 minutos
- **Indicador de Não Lidas** — badge no header e ícone de visualizado (duplo check)
- **Emoji Picker** — seletor de emojis integrado

### Dashboard e Indicadores
- **Dashboard Principal** — cards com totais do mês, pendentes, em desenvolvimento, pilotagem, concluídos, produtos CAD
- **Gráficos** — tendência mensal (linha), distribuição por status (barras), distribuição por tipo (pizza)
- **Atividades Recentes** — feed com últimas movimentações do sistema
- **Dashboard Amostras** — indicadores específicos de amostras de desenvolvimento
- **Dashboard Amostra Comercial** — indicadores de requisições de amostra comercial
- **Dashboard Requisições de Corte** — métricas de corte

### Relatórios (10 tipos)
- Solicitações Criadas (período)
- Solicitações por Status
- Solicitações Concluídas
- Histórico de Solicitação (auditoria completa)
- Amostras por Status
- Amostra Comercial por Status
- Histórico de Amostra
- Tempo em Status (solicitações e amostras)
- Atividade por Usuário

### Documentos
- **Romaneios de Expedição** — consulta via integração com ERP, agrupamento por lote com subtotais, grade de rolos (metragem, pesos, largura, endereço), geração de PDF retrato ou paisagem
- **Pré-DANFE** — geração de pré-DANFE para faturamento (em desenvolvimento)

### Ferramentas
- **Calculadora de Regra de Três** — resolve regra de três simples (direta/inversa) e composta
- **Conversor de Numeração de Fio** — conversão entre Ne, Nm, Tex, Dtex e Denier
- **Email em Massa** — envio para múltiplos destinatários com listas e modelos

### Administração
- **Usuários** — CRUD completo com perfis de acesso
- **Perfis (Roles)** — gestão de papéis (ADMIN, COMERCIAL, TECELAGEM, BENEFICIAMENTO, PCP)
- **Permissões** — controle CRUD granular por perfil e módulo
- **Telas / Menus** — configuração de menus por perfil com drag-and-drop, reordenação, página inicial personalizada
- **Status** — gerenciamento de fluxos de status por módulo (solicitações, amostras, produtos)
- **Empresa** — configuração de logo, CNPJ, endereço, dados fiscais para relatórios e exportações
- **SMTP** — configuração de servidor de e-mail com teste de envio
- **Integrações** — conexões com sistemas externos (ERP, API, WMS) via endpoints configuráveis
- **Notificações** — regras de quem recebe cada tipo de notificação
- **Banco de Dados** — gerenciamento de conexões, criação, clone, backup
- **Email em Massa** — listas de contatos, modelos de e-mail, envio programado
- **Logs de Auditoria** — rastreamento de todas as ações no sistema

### Perfil do Usuário
- **Dados do Perfil** — visualizar nome, email, perfil
- **Alterar Senha** — com gerador de senha segura, mostrar/ocultar
- **Menus Personalizados** — criar, editar, reordenar menus com drag-and-drop, adicionar telas disponíveis

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend / Backend | Next.js 14 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 18 + Tailwind CSS 3.4 + shadcn/ui + Base UI |
| ORM | Drizzle ORM 0.45 |
| Database | PostgreSQL (Neon Serverless) |
| Auth | NextAuth.js 4 (Credentials + JWT) |
| Storage | Vercel Blob |
| PDF | jsPDF + jspdf-autotable |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Drag & Drop | dnd-kit |
| Tabelas | TanStack Table |
| Upload | react-dropzone |
| Notificações | Sonner (toast) |
| Cache/Estado | TanStack Query |
| E-mail | Nodemailer |
| Criptografia | AES-256-GCM |
| Testes | Vitest + Testing Library |
| Hospedagem | Vercel |

---

## Estrutura

```
src/
├── app/
│   ├── (dashboard)/           # Área logada (protegida por middleware)
│   │   ├── admin/             # Configurações, usuários, integrações
│   │   │   └── configuracoes/ # SMTP, BD, permissões, empresa, telas, status
│   │   ├── amostras/          # Listagem e kanban de amostras
│   │   ├── cadastros/         # Fios, cores, estampas, produtos, receitas...
│   │   ├── chat/              # Chat corporativo
│   │   ├── comercial/         # Solicitações, clientes, req. corte
│   │   │   ├── solicitacoes/  # Lista, kanban, nova, editar, detalhe
│   │   │   ├── clientes/      # Lista, detalhe, novo
│   │   │   ├── requisicoes-corte/
│   │   │   └── requisicoes-amostra-comercial/
│   │   ├── dashboard/         # Dashboard + 10 relatórios
│   │   ├── documentos/        # Romaneios, pré-DANFE
│   │   ├── ferramentas/       # Regra de três, conversores
│   │   └── perfil/            # Perfil, senha, menus personalizados
│   ├── api/                   # API Routes (100+ endpoints)
│   │   ├── admin/             # CRUDs administrativos
│   │   ├── amostras/          # Amostras + status
│   │   ├── cadastros/         # Todos os cadastros
│   │   ├── chats/             # Mensagens, menções, notificações
│   │   ├── clientes/          # Clientes + importação
│   │   ├── comercial/         # Requisições de corte
│   │   ├── dashboard/         # Stats e listas
│   │   ├── db/                # Migrations, seed
│   │   ├── integracao/        # Importação via API externa
│   │   ├── notificacoes/      # Notificações in-app
│   │   ├── perfil/            # Senha
│   │   ├── proxy-image/       # Proxy de imagens
│   │   ├── receitas/          # Receitas
│   │   ├── relatorios/        # 10 endpoints de relatório
│   │   ├── requisicoes-amostra-comercial/
│   │   ├── solicitacoes/      # Solicitações + status
│   │   ├── user/              # Menus, página inicial
│   │   └── usuarios/          # Usuários ativos
│   ├── login/                 # Página de login
│   └── page.tsx               # Landing page com animação
├── components/
│   ├── chat/                  # Emoji picker, entity button
│   ├── exportar/              # Exportação de dados
│   ├── forms/                 # Briefing, anexos, autocomplete
│   ├── importar/              # Importação em lote (CSV/planilha)
│   ├── integracao/            # Modal de importação via API
│   ├── kanban/                # Kanban de solicitações e amostras
│   ├── layout/                # Sidebar, header, nav, command search
│   ├── links/                 # Editor de links
│   ├── receita/               # Dialog de receita de acabamento
│   ├── ui/                    # shadcn/ui components
│   └── providers.tsx          # Providers (auth, theme, query)
├── hooks/
│   └── use-statuses.ts        # Hook de status com labels e cores
├── lib/
│   ├── db/
│   │   ├── schema/            # 31 tabelas (Drizzle)
│   │   ├── index.ts           # Conexão com banco
│   │   └── seed.ts            # Dados iniciais
│   ├── auth.ts                # NextAuth config
│   ├── email.ts               # Nodemailer
│   ├── notificar.ts           # Notificações + email
│   ├── log.ts                 # Auditoria
│   ├── crypto.ts              # Criptografia AES-256-GCM
│   ├── info-content/          # Ajuda contextual (8 módulos)
│   ├── validation.ts          # Schemas Zod
│   ├── error-handler.ts       # Tratamento de erros
│   ├── api-error.ts           # Erros de API
│   ├── dump.ts                # Exportação de dados
│   ├── db-admin.ts            # Admin de banco de dados
│   ├── export-utils.ts        # Utilitários de exportação
│   ├── search-registry.ts     # Registro de busca
│   ├── status-utils.ts        # Utilitários de status
│   ├── tipos-status.ts        # Tipos de status
│   ├── utils.ts               # Utilitários gerais
│   └── gerar-*-pdf.ts         # Geradores de PDF (3 tipos)
├── middleware.ts               # Proteção de rotas (NextAuth)
└── types/                      # Tipos TypeScript
```

---

## Banco de Dados (31 tabelas)

```
🔐 Usuários e Acesso
  usuarios, sessions, roles

📄 Solicitações e Desenvolvimento
  solicitacoes, anexos,
  clientes,
  requisicoes_corte, requisicoes_corte_itens,
  requisicoes_amostra_comercial

🧵 Cadastro Técnico
  fios, fornecedores,
  cores_solidas, cores_fundo,
  acabamentos, maquinas, operacoes,
  bases_urdume, base_urdume_fios,
  estampas,
  produtos_quimicos

🏭 Produto Cru (Engenharia)
  produtos_cru,
  produto_cru_composicao,
  produto_cru_estrutura,
  produto_cru_amostra,
  produto_cru_acabamento,
  produto_cru_receita, produto_cru_receita_item

🧪 Receitas de Beneficiamento
  receitas, receita_itens

💬 Comunicação
  chats, chat_mensagens, chat_participantes, chat_leituras

📦 Documentos
  romaneios, romaneio_pecas

⚙️ Administração
  integracoes,
  config_empresa,
  email_config, email_modelos, email_listas, email_lista_contatos,
  notificacoes, notificacao_regras,
  logs,
  bancos_dados,
  status,
  user_menus, user_menu_itens
```

---

## Instalação

```bash
# Pré-requisitos: Node.js 18+, PostgreSQL (Neon)

git clone https://github.com/devtiagoabreu/pdmtextil.git
cd pdmtextil
npm install

cp .env.example .env.local
# Edite .env.local com suas credenciais

npm run db:migrate
npm run dev
```

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32"
BLOB_READ_WRITE_TOKEN="vercel_blob_token"
ENCRYPTION_KEY="chave-32-caracteres-ou-mais"
NEXT_PUBLIC_APP_URL="https://pdmprotextil.vercel.app"
```

---

## Usuários de Teste (Seed)

| Email | Senha | Perfil |
|---|---|---|
| comercial@pdmprotextil.com.br | 123456 | COMERCIAL |
| tecelagem@pdmprotextil.com.br | 123456 | TECELAGEM |
| beneficiamento@pdmprotextil.com.br | 123456 | BENEFICIAMENTO |
| admin@pdmprotextil.com.br | 123456 | ADMIN |

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Criar tabelas no banco |
| `npm test` | Vitest |
| `npm run test:watch` | Vitest watch |

---

## Licença

MIT — © 2026 Tiago de Abreu

---

## Créditos

Desenvolvido por **Pro Moda Têxtil**.

Inspirado pelo sistema **[Apontador](https://github.com/devtiagoabreu/apontador)** — Sistema de Apontamento Têxtil (MES) criado por [Tiago de Abreu](https://github.com/devtiagoabreu).

[![GitHub](https://img.shields.io/badge/GitHub-@devtiagoabreu-181717?logo=github)](https://github.com/devtiagoabreu)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Tiago%20Abreu-0077B5?logo=linkedin)](https://linkedin.com/in/devtiagoabreu)
