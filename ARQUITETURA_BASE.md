# Arquitetura Base — Template SaaS Multi-Tenant

Este documento descreve a engenharia, arquitetura e padrões de desenvolvimento
usados como base para qualquer projeto SaaS. Sirva-se dele como template mental
— seja um monitor de fissuras prediais, um ERP, um gestor de entregas ou um CRM.
O "cerne" está nos padrões, não no domínio.

> **Exemplo concreto usado neste documento:**
> Uma plataforma onde construtoras (clientes) cadastram edificações. Cada
> edificação pode ter diversos tipos de cadastro associados:
> Engenheiros, Arquitetos, Equipamentos, Monitores de fissura, Sensores,
> Laudos técnicos, etc. — e o sistema deve estar aberto para novos tipos
> sem precisar reestruturar o banco. Os monitores (ex: ESP32) enviam dados
> de sensores em tempo real via MQTT. Cada construtora vê apenas seus
> próprios dados (multi-tenancy).

---

## 1. Stack Tecnológica (Decisões de Engenharia)

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR + API Routes num projeto só. Zero overhead de servidor separado. |
| Linguagem | **TypeScript 5 (strict)** | Catch de erros em tempo de compilação. Tipos são documentação viva. |
| Banco | **PostgreSQL (Neon)** | SQL relacional maduro, serverless-ready, ótimo com Drizzle. |
| ORM | **Drizzle ORM** | Type-safe, schema-first, migrations manuais explícitas, sem magia. |
| Auth | **NextAuth.js v4** | Padrão da comunidade, adaptável a qualquer provider (credentials, OAuth). |
| UI | **shadcn/ui + Tailwind CSS** | Componentes headless e estilizados, sem dependência pesada. |
| Formulários | **React Hook Form + Zod** | Performance (uncontrolled) + validação declarativa. |
| Cache / Server State | **TanStack Query** | Cache, refetch, loading states sem boilerplate. |
| Tabelas | **TanStack Table** | Cabeçalho fixo, ordenação, filtro, seleção, paginação. |
| Gráficos | **Recharts** | Leve, declarativo, React-native. |
| PDF | **jsPDF + jspdf-autotable** | Geração client-side, sem servidor. |
| Upload | **Vercel Blob + react-dropzone** | Sem gerenciar storage próprio. |
| Notificações | **Sonner** | Leve, acessível, bonito. |
| Email | **Nodemailer (SMTP)** | Controle total sobre templates e entrega. |
| MQTT Broker | **EMQX (ou Mosquitto)** | Broker escalável para IoT. Cada monitor (ESP32) se conecta como cliente e publica leituras em tópicos. |
| WebSocket | **Socket.IO** | Bridge MQTT → navegador. Leituras em tempo real sem polling. |
| Tema | **next-themes** | Dark/light mode com persistência e sem flicker. |
| Deploy | **Vercel** (web) + **VPS/Docker** (MQTT broker) | Web em serverless, broker em servidor dedicado para latência zero. |

### Regra de Engenharia #1
> *Cada tecnologia resolve um problema específico. Se não resolve, não use.*

---

## 2. Multi-Tenancy (Arquitetura de Dados)

Cada cliente da plataforma SaaS é um **tenant**. Todos os dados pertencem a um
tenant e são isolados por `tenant_id` em todas as tabelas.

```sql
-- Tabela base: edificações
CREATE TABLE edificacoes (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  nome       VARCHAR(200) NOT NULL,
  endereco   TEXT,
  ativo      VARCHAR(1) DEFAULT 'S',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edificacoes_tenant ON edificacoes(tenant_id);

--------------------------------------------------------------
-- ENTIDADES DA EDIFICAÇÃO (modelo extensível)
--------------------------------------------------------------
-- Cada edificação pode ter N tipos de entidade:
-- Engenheiro, Arquiteto, Equipamento, Monitor, Laudo, Sensor etc.
-- O campo `tipo_entidade` define qual é a entidade.
-- O campo `dados` (JSONB) armazena os atributos específicos
-- de cada tipo sem precisar criar uma tabela nova.
--------------------------------------------------------------
CREATE TABLE entidades_da_edificacao (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  tipo_entidade   VARCHAR(50) NOT NULL,  -- 'engenheiro', 'arquiteto', 'equipamento', 'monitor', 'laudo', 'sensor', ...
  nome            VARCHAR(200) NOT NULL,
  descricao       TEXT,
  dados           JSONB NOT NULL DEFAULT '{}',
    -- ^ Armazena atributos variáveis por tipo:
    --   engenheiro → { "crea": "12345", "especialidade": "estrutural" }
    --   monitor    → { "modelo": "ESP32", "firmware": "v2.1", "topico_mqtt": "predio/3/sensor/01" }
    --   equipamento→ { "fabricante": "Hilti", "num_serie": "HS-8890", "calibracao": "2025-03-10" }
    --   laudo      → { "responsavel": "Dr. Silva", "data": "2026-01-15", "anexo_url": "..." }
  ativo           VARCHAR(1) DEFAULT 'S',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entidades_tenant    ON entidades_da_edificacao(tenant_id);
CREATE INDEX idx_entidades_edificacao ON entidades_da_edificacao(edificacao_id);
CREATE INDEX idx_entidades_tipo      ON entidades_da_edificacao(tipo_entidade);

--------------------------------------------------------------
-- LEITURAS DOS SENSORES (dados temporais)
--------------------------------------------------------------
CREATE TABLE leituras (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  entidade_id     INTEGER NOT NULL REFERENCES entidades_da_edificacao(id) ON DELETE CASCADE,
  topico_mqtt     VARCHAR(500),
  valor           NUMERIC(12, 4),
  unidade         VARCHAR(20),          -- 'mm', '°C', '%UR', 'kPa' ...
  metadata        JSONB DEFAULT '{}',   -- payload completo do MQTT
  lida_em         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leituras_entidade ON leituras(entidade_id);
CREATE INDEX idx_leituras_tempo    ON leituras(lida_em DESC);
```

### Fluxo de Isolamento

```
Usuário faz login
       │
       ▼
Sessão contém tenant_id
       │
       ▼
Toda query no backend filtra por tenant_id
  → WHERE tenant_id = sessao.tenant_id
       │
       ▼
Usuário vê APENAS dados do seu tenant
```

### Como implementar no código

```ts
// lib/db/queries.ts
import { auth } from "@/lib/auth"
import { eq, and } from "drizzle-orm"

export async function getEdificacoes() {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  return db.select().from(edificacoes)
    .where(eq(edificacoes.tenantId, session.user.tenantId))
}
```

```ts
// lib/db/schema/edificacoes.ts
import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const edificacoes = pgTable("edificacoes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  nome: varchar("nome", { length: 200 }).notNull(),
  endereco: text("endereco"),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})
```

```ts
// lib/db/schema/entidades-da-edificacao.ts
import { pgTable, serial, varchar, integer, timestamp, text, jsonb } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { edificacoes } from "./edificacoes"

export const entidadesDaEdificacao = pgTable("entidades_da_edificacao", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  tipoEntidade: varchar("tipo_entidade", { length: 50 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  dados: jsonb("dados").notNull().default({}),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type EntidadeDaEdificacao = typeof entidadesDaEdificacao.$inferSelect
export type NewEntidadeDaEdificacao = typeof entidadesDaEdificacao.$inferInsert
```

```ts
// lib/db/schema/leituras.ts
import { pgTable, serial, varchar, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { entidadesDaEdificacao } from "./entidades-da-edificacao"

export const leituras = pgTable("leituras", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  entidadeId: integer("entidade_id").notNull().references(() => entidadesDaEdificacao.id, { onDelete: "cascade" }),
  topicoMqtt: varchar("topico_mqtt", { length: 500 }),
  valor: numeric("valor", { precision: 12, scale: 4 }),
  unidade: varchar("unidade", { length: 20 }),
  metadata: jsonb("metadata").default({}),
  lidaEm: timestamp("lida_em").defaultNow(),
})
```

---

## 3. Estrutura de Diretórios (Padrão)

```
src/
├── app/
│   ├── (auth)/                  # Login, registro, recover
│   ├── (dashboard)/             # Grupo protegido (requer sessão + tenant)
│   │   ├── modulo-x/
│   │   │   ├── page.tsx         # Listagem (filtrada por tenant)
│   │   │   ├── [id]/page.tsx    # Detalhe
│   │   │   └── novo/page.tsx    # Criação
│   │   ├── layout.tsx           # Dashboard shell (sidebar + header)
│   │   └── page.tsx             # Dashboard principal
│   └── api/
│       ├── modulo-x/
│       │   ├── route.ts         # CRUD (sempre filtra por tenant)
│       │   └── [id]/route.ts
│       └── auth/                # NextAuth
├── components/
│   ├── ui/                      # shadcn/ui (button, input, dialog, etc.)
│   ├── layout/                  # Sidebar, Header, DashboardShell
│   ├── forms/                   # Formulários reutilizáveis
│   └── modulo-x/                # Componentes do módulo
├── lib/
│   ├── db/
│   │   ├── schema/              # Tabelas Drizzle (1 arquivo por tabela)
│   │   ├── migrations/          # SQL de migração (ordem numérica)
│   │   └── index.ts             # Conexão com banco
│   ├── auth.ts                  # Config NextAuth
│   ├── utils.ts                 # Funções utilitárias (cn, formatação)
│   ├── validation.ts            # Schemas Zod
│   └── api-error.ts             # Error handler padrão
├── middleware.ts                # Proteção de rotas
└── types/
    ├── index.ts                 # Tipos globais
    └── next-auth.d.ts           # Extensão dos tipos da sessão
```

---

## 4. Padrões de Código

### 4.1. Componentes

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  titulo: string
  onConfirm: () => void
}

export function MeuComponente({ titulo, onConfirm }: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="space-y-4">
      <Button onClick={() => setAberto(true)}>{titulo}</Button>
    </div>
  )
}
```

**Regras:**
- Props sempre tipadas com `interface` (nunca `type` para props)
- Nomes em português (UI visível), código em inglês (lógica)
- Arquivos em kebab-case: `meu-componente.tsx`
- Páginas (app router) SEM `export default` nomeado — só `export default`
- Componentes reutilizáveis SEM `export default` — só nomeado

### 4.2. API Routes

```ts
// src/app/api/edificacoes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db.select().from(edificacoes)
      .where(eq(edificacoes.tenantId, session.user.tenantId))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const [novo] = await db.insert(edificacoes)
      .values({ ...body, tenantId: session.user.tenantId })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
```

### 4.3. Banco (Drizzle Schema)

```ts
// src/lib/db/schema/edificacoes.ts
import { pgTable, serial, varchar, timestamp, integer, text } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const edificacoes = pgTable("edificacoes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  nome: varchar("nome", { length: 200 }).notNull(),
  endereco: text("endereco"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Edificacao = typeof edificacoes.$inferSelect
export type NewEdificacao = typeof edificacoes.$inferInsert
```

**Regras:**
- Nomes SQL em snake_case
- Propriedades TypeScript em camelCase (Drizzle mapeia)
- Toda tabela de domínio tem `tenant_id`, `id`, `created_at`, `updated_at`
- Chaves estrangeiras explícitas com `references()`

### 4.4. Migrations

```sql
-- src/lib/db/migrations/0001_estrutura_inicial.sql
CREATE TABLE IF NOT EXISTS tenants (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(200) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  nome       VARCHAR(200) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edificacoes (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  nome       VARCHAR(200) NOT NULL,
  endereco   TEXT,
  ativo      VARCHAR(1) DEFAULT 'S',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entidades_da_edificacao (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  tipo_entidade   VARCHAR(50) NOT NULL,
  nome            VARCHAR(200) NOT NULL,
  descricao       TEXT,
  dados           JSONB NOT NULL DEFAULT '{}',
  ativo           VARCHAR(1) DEFAULT 'S',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leituras (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  entidade_id     INTEGER NOT NULL REFERENCES entidades_da_edificacao(id) ON DELETE CASCADE,
  topico_mqtt     VARCHAR(500),
  valor           NUMERIC(12, 4),
  unidade         VARCHAR(20),
  metadata        JSONB DEFAULT '{}',
  lida_em         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edificacoes_tenant     ON edificacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entidades_tenant       ON entidades_da_edificacao(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entidades_edificacao   ON entidades_da_edificacao(edificacao_id);
CREATE INDEX IF NOT EXISTS idx_entidades_tipo         ON entidades_da_edificacao(tipo_entidade);
CREATE INDEX IF NOT EXISTS idx_leituras_entidade      ON leituras(entidade_id);
CREATE INDEX IF NOT EXISTS idx_leituras_tempo         ON leituras(lida_em DESC);
```

**Regras (idempotência):**
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Script (`scripts/migrate.js`) executa SQLs em ordem numérica

---

## 5. Layout System

### 5.1 Dashboard Shell

```
┌──────────────────────────────────────────┐
│ Sidebar (240px)  │  Header + Content     │
│                  │───────────────────────│
│  ● Dashboard     │                       │
│  ● Edificações   │  <children>           │
│  ● Entidades     │                       │
│  ● Leituras      │                       │
│  ● Relatórios    │                       │
│  ● Config        │                       │
│                  │                       │
│ ──────────────── │                       │
│  🌙 Tema        │                       │
│  👤 Admin        │                       │
└──────────────────────────────────────────┘
```

**Responsivo:**
- Desktop: Sidebar fixa à esquerda (240px), header no topo
- Tablet: Sidebar colapsável (ícones apenas)
- Mobile: Bottom nav + header com menu hamburger

### 5.2 Tema

```css
/* globals.css — variáveis para tema claro/escuro */
:root {
  --bg-primary: #fff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --brand: #2563eb;
  --brand-foreground: #fff;
}

.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
  --brand: #3b82f6;
  --brand-foreground: #fff;
}
```

Usar sempre classes `dark:` do Tailwind — nunca CSS condicional em runtime.

### 5.3 Navegação

```ts
const NAV_ITENS = [
  {
    titulo: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "USER"],
  },
  {
    titulo: "Edificações",
    href: "/edificacoes",
    icon: Building2,
    roles: ["ADMIN", "USER"],
  },
  {
    titulo: "Entidades",
    href: "/entidades",
    icon: Users,
    roles: ["ADMIN", "USER"],
  },
  {
    titulo: "Leituras",
    href: "/leituras",
    icon: Activity,
    roles: ["ADMIN", "USER"],
  },
  {
    titulo: "Administração",
    href: "/admin",
    icon: Settings,
    roles: ["ADMIN"],
    children: [
      { titulo: "Usuários", href: "/admin/usuarios" },
      { titulo: "Integrações", href: "/admin/integracoes" },
    ],
  },
]
```

- Sidebar filtra por role
- Item ativo destacado com cor `--brand`
- Submenu expansível com transição suave

---

## 6. Autenticação e Autorização

### 6.1 NextAuth com Credentials + Tenant

```ts
// lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await db.query.usuarios.findFirst({
          where: eq(usuarios.email, credentials.email as string),
          with: { tenant: true },
        })

        if (!user || !bcrypt.compareSync(credentials.password as string, user.password)) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.tenantId = token.tenantId as number
      session.user.tenantSlug = token.tenantSlug as string
      session.user.role = token.role as string
      return session
    },
  },
})
```

### 6.2 Extensão dos Tipos

```ts
// types/next-auth.d.ts
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      tenantId: number
      tenantSlug: string
    }
  }
}
```

### 6.3 Proteção (Middleware)

```ts
// middleware.ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/api/auth")

  if (!isLoggedIn && !isPublic) {
    return Response.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && pathname === "/login") {
    return Response.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### 6.4 Roles

```ts
type Role = "ADMIN" | "USER" | "VIEWER"

// Frontend
const { data: session } = useSession()
if (!session?.user.role?.includes("ADMIN")) return <Unauthorized />

// Backend
const session = await auth()
if (session?.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
}
```

---

## 7. Integração com APIs Externas (Genérico)

```
┌────────────┐     ┌────────────────┐     ┌──────────────┐
│ Página     │────▶│ /api/integracao │────▶│ API Externa  │
│ Módulo X   │     │ /[id]/executar  │     │ (ERP, IoT..) │
└────────────┘     └────────────────┘     └──────────────┘
                         │
                         ▼
                  ┌────────────────┐
                  │  Mapeamento     │
                  │  campos         │
                  │  API → Sistema  │
                  └────────────────┘
```

**Sistema genérico de integração:**
1. Admin cadastra a integração (URL base, auth, endpoints)
2. Admin mapeia campos da API para campos do sistema
3. Usuário seleciona integração na página e busca dados
4. Dados podem ser salvos localmente ou apenas exibidos
5. Toda requisição à API externa usa os headers de auth configurados

---

## 8. Geração de Relatórios (PDF)

```ts
// Sempre import dinâmico para não aumentar bundle inicial
const gerarPDF = async (dados: DadosRelatorio) => {
  const { default: jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const doc = new jsPDF("portrait")
  const margin = 15
  let y = margin

  doc.setFontSize(16).setFont("helvetica", "bold")
  doc.text("Relatório de Monitores", margin, y)
  y += 10

  doc.autoTable({
    head: [["Edificação", "Monitor", "Status", "Última Leitura"]],
    body: dados.map(d => [d.edificacao, d.monitor, d.status, d.ultimaLeitura]),
    startY: y,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
  })

  doc.save("relatorio-monitores.pdf")
}
```

---

## 9. Estilos e Animações

```css
/* globals.css */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.animate-fade-in   { animation: fade-in 0.3s ease-out; }
.animate-slide-in  { animation: slide-in 0.3s ease-out; }
.animate-scale-in  { animation: scale-in 0.2s ease-out; }
```

**Glass-morphism (cards, modais, sidebars):**

```tsx
<div className="rounded-xl border border-slate-200 dark:border-slate-800
            bg-white dark:bg-slate-900 shadow-sm">
```

---

## 10. Tratamento de Erros

### Frontend

```tsx
try {
  const res = await fetch("/api/edificacoes")
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
} catch {
  toast.error("Erro ao carregar edificações")
}
```

### Backend

```ts
// lib/api-error.ts
import { NextResponse } from "next/server"

export function apiError(err: unknown) {
  console.error("[API]", err)
  const message = err instanceof Error ? err.message : "Erro interno do servidor"
  return NextResponse.json({ error: message }, { status: 500 })
}
```

---

## 11. Tabela `tenants` (Cadastro de Clientes)

```ts
// src/lib/db/schema/tenants.ts
import { pgTable, serial, varchar, timestamp, jsonb } from "drizzle-orm/pg-core"

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  config: jsonb("config").default({}),    // configurações específicas do tenant
  logo: varchar("logo", { length: 500 }),  // URL do logo
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})
```

**Relacionamentos:**
- `usuarios.tenant_id → tenants.id`
- `edificacoes.tenant_id → tenants.id`
- `entidades_da_edificacao.tenant_id → tenants.id`
- `leituras.tenant_id → tenants.id`

---

## 12. MQTT Broker — Ponte IoT → Sistema

Cada monitor (ESP32, Arduino, etc.) é um cliente MQTT que se conecta ao
broker e publica leituras em tópicos. O sistema assina os tópicos e persiste
os dados na tabela `leituras`.

### Arquitetura

```
                    ┌──────────────────┐
  ESP32 ──mqtt──▶   │                  │   ┌──────────────┐
  Sensor #1         │   EMQX Broker    │──▶│  API (Web)   │
                    │  (porta 1883)    │   │  /api/mqtt/  │
  ESP32 ──mqtt──▶   │                  │   │  webhook     │
  Sensor #2         └──────────────────┘   └──────┬───────┘
                         │                        │
                         ▼                        ▼
                  ┌──────────────┐        ┌──────────────┐
                  │  Socket.IO   │        │  PostgreSQL  │
                  │  (tempo real)│        │  (leituras)  │
                  └──────────────┘        └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  Dashboard   │
                  │  (navegador) │
                  └──────────────┘
```

### Convenção de Tópicos

```
pdm/{tenant_slug}/{edificacao_id}/{entidade_id}/leitura
```

Exemplo:
```
pdm/construtora-abc/3/15/leitura
```

Payload:
```json
{
  "valor": 0.47,
  "unidade": "mm",
  "timestamp": "2026-06-08T10:30:00Z",
  "bateria": 85,
  "rssi": -67
}
```

### Fluxo de uma leitura

1. ESP32 acorda, lê sensor, publica no tópico MQTT
2. EMQX entrega a mensagem para o webhook `/api/mqtt/webhook`
3. A API identifica `tenant`, `edificacao` e `entidade` pelo tópico
4. Insere linha na tabela `leituras`
5. Emite evento Socket.IO para o dashboard do tenant atualizar em tempo real

### Stack MQTT sugerida

| Componente | Tecnologia |
|---|---|
| Broker | **EMQX** (escalável, clusterizável, dashboard próprio) |
| Clientes | ESP32 com **PubSubClient** ou **arduino-mqtt** |
| Webhook | `POST /api/mqtt/webhook` (Next.js API Route) |
| Tempo real | **Socket.IO** servidor + client React |
| TLS | Porta 8883 com certificado Let's Encrypt |

### Configuração do EMQX (exemplo)

```hcl
# emqx.conf
listeners.tcp.default {
  bind = "0.0.0.0:1883"
}

authorization {
  sources = [
    {
      type = http
      enable = true
      url = "http://localhost:3000/api/mqtt/auth"
    }
  ]
}

webhook {
  url = "http://localhost:3000/api/mqtt/webhook"
  event.message_publish = true
}
```

### Webhook no Next.js

```ts
// src/app/api/mqtt/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"

export async function POST(req: NextRequest) {
  const body = await req.json()
  // body contém: topic, payload, clientid, etc.

  const topicParts = body.topic.split("/")
  // pdm/{tenant_slug}/{edificacao_id}/{entidade_id}/leitura
  const [, tenantSlug, edificacaoId, entidadeId] = topicParts

  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, tenantSlug),
  })
  if (!tenant) return NextResponse.json({ error: "tenant not found" }, { status: 404 })

  const dados = JSON.parse(body.payload)
  await db.insert(leituras).values({
    tenantId: tenant.id,
    entidadeId: Number(entidadeId),
    topicoMqtt: body.topic,
    valor: dados.valor,
    unidade: dados.unidade,
    metadata: dados,
  })

  // Emitir via Socket.IO para o dashboard
  // getIO().to(`tenant:${tenant.id}`).emit("leitura", dados)

  return NextResponse.json({ ok: true })
}
```

---

## 13. Boas Práticas Gerais

| Prática | Como fazer |
|---|---|
| Imports | Caminhos absolutos com `@/` |
| CSS | Tailwind classes, raramente CSS modules |
| Tipos | `interface` para props, `type` para uniões/enums |
| Hooks | Sempre com dependências explícitas |
| State | Local com `useState`, server state com TanStack Query |
| Formulários | React Hook Form + Zod schema |
| Feedback | Sonner toast para sucesso/erro |
| Loading | `Loader2` com `animate-spin` do lucide-react |
| Mobile | Bottom nav + sidebar colapsável |
| Tema | next-themes com classe `.dark` |
| Segurança | Senhas com bcrypt, dados sensíveis com AES-256-GCM |
| Banco | Drizzle schema + migrations SQL manuais e idempotentes |
| API externa | Sempre via API Route (nunca do client direto) |
| Tenant | Toda query tem `WHERE tenant_id = ?` |
| Tipagem | Nunca usar `any` — tipar retornos de API com `z.infer` |

---

## 14. Checklist para Novo Projeto SaaS

- [ ] `npx create-next-app@14` com TypeScript + App Router
- [ ] Configurar Tailwind + globals.css + variáveis de tema (claro/escuro)
- [ ] Instalar shadcn/ui (`npx shadcn@latest init`)
- [ ] Configurar Drizzle ORM + PostgreSQL
- [ ] Criar tabela `tenants` + schema Drizzle
- [ ] Criar tabela `usuarios` com `tenant_id` + NextAuth
- [ ] Extender tipos da sessão (`tenantId`, `role`)
- [ ] Middleware de proteção de rotas
- [ ] DashboardShell (sidebar + header + bottom nav)
- [ ] Toda query de domínio filtra por `tenant_id`
- [ ] Modelo extensível: `entidades_da_edificacao` com JSONB para atributos variáveis
- [ ] Sistema de notificações (Sonner)
- [ ] Error handler padrão (front + back)
- [ ] Componentes base: Button, Input, Dialog, Select, Tabs, Table
- [ ] Script de migrate (`scripts/migrate.js`)
- [ ] Configurar EMQX (ou Mosquitto) como broker MQTT
- [ ] Webhook `/api/mqtt/webhook` para persistir leituras
- [ ] Socket.IO para tempo real no dashboard
- [ ] Convenção de tópicos MQTT: `pdm/{tenant}/{edificacao}/{entidade}/leitura`
- [ ] README com instruções de setup e variáveis de ambiente

---

> *"Um bom arquiteto de software projeta pensando no próximo sistema, não só no atual."*
>
> — Template SaaS Multi-Tenant, 2026
