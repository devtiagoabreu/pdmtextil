# Estudo de Implementação: Dashboard de Monitoramento do Fluxo WhatsApp IA

**Data:** 2026-07-25
**Status:** Implementado
**Autor:** Tiago de Abreu

---

## 1. Contexto e Problema

O bot WhatsApp IA (`/api/crm/whatsapp/ai-webhook`) executa um fluxo complexo com múltiplas etapas: autenticação, extração de dados, chamada à IA (Groq), máquina de estados, persistência, envio de resposta e criação de lead.

Quando ocorre um erro, não há visibilidade de **onde** ele acontece. O log atual é apenas `console.error` no Vercel, que é difícil de correlacionar entre etapas.

**Objetivo:** Criar uma tela visual no PDM que mostra o fluxo completo de cada execução, nó a nó, com status de sucesso/erro — similar à visualização do n8n.

---

## 2. Arquitetura da Solução

### 2.1 Tabela de Logs: `crm_whatsapp_flow_logs`

Cada execução do webhook gera múltiplos registros (um por etapa), todos compartilhando o mesmo `execution_id`.

```sql
CREATE TABLE crm_whatsapp_flow_logs (
  id SERIAL PRIMARY KEY,
  execution_id UUID NOT NULL,
  remote_jid VARCHAR(255),
  push_name VARCHAR(255),
  step VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flow_logs_execution_id ON crm_whatsapp_flow_logs(execution_id);
CREATE INDEX idx_flow_logs_created_at ON crm_whatsapp_flow_logs(created_at DESC);
CREATE INDEX idx_flow_logs_status ON crm_whatsapp_flow_logs(status);
```

### 2.2 Etapas do Fluxo (Step Names)

| # | Step | Descrição | O que loga |
|---|---|---|---|
| 1 | `auth` | Autenticação do webhook | secret válido, método usado |
| 2 | `extract` | Extração de dados do payload | remoteJid, pushName, fromMe, tipo de mensagem |
| 3 | `filter` | Filtragem de mensagens inválidas | motivo do skip (fromMe, empty, no_sender) ou "passed" |
| 4 | `find_conversation` | Busca/criação de conversa | estado encontrado, se é nova, lead existente |
| 5 | `groq_call` | Chamada à API Groq | modelo, tokens, resposta truncada |
| 6 | `state_machine` | Máquina de estados | estado anterior → próximo estado, dados extraídos |
| 7 | `save_messages` | Persistência no banco | mensagens salvas (recebida + enviada) |
| 8 | `send_response` | Envio via Evolution API | sucesso/erro, remoteJid destino |
| 9 | `create_lead` | Criação de lead no CRM (condicional) | lead ID, dados, se já existia |
| 10 | `notify` | Notificação ao representante (condicional) | para quem, texto |

### 2.3 Diagrama Visual

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌───────────┐
│   Auth   │──►│ Extract  │──►│  Filter  │──►│ Find Conv    │──►│ Groq IA  │──►│  Estado   │
│    ✅    │   │    ✅    │   │    ✅    │   │     ✅       │   │    ❌    │   │ (skip)    │
└──────────┘   └──────────┘   └──────────┘   └──────────────┘   └──────────┘   └───────────┘
                                                                          │
                                                                          ▼
                                                                ┌──────────────┐
                                                                │ Send Response│
                                                                │      ✅      │
                                                                └──────────────┘
```

---

## 3. Arquivos Criados/Modificados

### 3.1 Novos

| Arquivo | Descrição |
|---|---|
| `src/lib/db/schema/crm-whatsapp-flow-logs.ts` | Schema Drizzle da tabela |
| `src/app/api/admin/whatsapp-monitor/route.ts` | API de consulta dos logs |
| `src/app/(dashboard)/admin/whatsapp-monitor/page.tsx` | Página de monitoramento |

### 3.2 Modificados

| Arquivo | Mudança |
|---|---|
| `src/lib/db/schema/index.ts` | Adicionar export do novo schema |
| `src/app/api/crm/whatsapp/ai-webhook/route.ts` | Instrumentar com `logStep()` em cada etapa |
| `src/components/layout/sidebar.tsx` | Adicionar link "Monitor WhatsApp" na seção admin |

---

## 4. API de Consulta

### `GET /api/admin/whatsapp-monitor`

**Parâmetros query:**
- `executionId` (opcional) — retorna todas as etapas de uma execução específica
- `limit` (opcional, default 50) — número de execuções
- `status` (opcional) — filtrar por status (`error`, `success`, `ignored`)

**Resposta (lista de execuções):**
```json
{
  "executions": [
    {
      "execution_id": "uuid",
      "remote_jid": "5519999999999@s.whatsapp.net",
      "push_name": "João",
      "started_at": "2026-07-25T12:00:00Z",
      "steps": [
        {
          "step": "auth",
          "status": "success",
          "duration_ms": 2,
          "error": null
        },
        {
          "step": "groq_call",
          "status": "error",
          "duration_ms": 1200,
          "error": "Groq API: 429 - Rate limited"
        }
      ]
    }
  ]
}
```

---

## 5. UI — Página de Monitoramento

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Monitor WhatsApp IA                              [Auto-refresh]
│  Acompanhe em tempo real as execuções do fluxo de atendimento│
├─────────────────────────────────────────────────────────────┤
│  [Buscar por nome/numero...] [Todos ▾] [🔄 Atualizar]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DIAGRAMA VISUAL (execução selecionada)                     │
│  ┌──────┐  ┌─────────┐  ┌────────┐  ┌───────────┐         │
│  │ Auth │─►│ Extract │─►│ Filter │─►│ Groq IA   │         │
│  │  ✅  │  │   ✅    │  │  ✅    │  │    ❌     │         │
│  └──────┘  └─────────┘  └────────┘  └───────────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIMELINE DETALHADA                                         │
│                                                             │
│  Execução #1 — João (5519999999) — 25/07 12:00             │
│  ┌─ ✅ auth ──────────────── 2ms                           │
│  │  Input: { method: "bearer" }                             │
│  │  Output: { valid: true }                                 │
│  │                                                          │
│  ├─ ✅ extract ────────────── 1ms                          │
│  │  Input: { remoteJid: "55199...@s.whatsapp.net" }        │
│  │  Output: { pushName: "João", msg: "Olá" }              │
│  │                                                          │
│  ├─ ❌ groq_call ──────────── 1200ms                       │
│  │  Input: { model: "llama-3.3-70b", estado: "SAUDACAO" } │
│  │  Error: Groq API: 429 - Rate limited                    │
│  │                                                          │
│  └─ ⏭️ state_machine ─────── skipped (dependent on groq)   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Execução #2 — Maria (5518888888) — 25/07 11:55            │
│  ...                                                       │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Funcionalidades

- **Auto-refresh:** Toggle para atualizar a cada 10 segundos
- **Filtros:** Busca por nome/número, filtro por status (todos/erro/sucesso)
- **Diagrama:** Nós conectados por setas, clicáveis (destaca na timeline)
- **Timeline:** Lista expansível com input/output/erro de cada etapa
- **Cores:** Verde (success), Vermelho (error), Cinza (skipped/ignored)

### 5.3 Componentes

- `Card` / `CardContent` — do `@/components/ui/card`
- `Button` — do `@/components/ui/button`
- `Input` — do `@/components/ui/input`
- Ícones — `lucide-react` (Check, X, SkipForward, AlertTriangle, RefreshCw, etc.)
- Status badges — Tailwind inline (sem componente separado)

---

## 6. Variáveis de Ambiente

Nenhuma variável nova necessária. Usa as existentes:
- `DATABASE_URL` (e os 3 secundários)
- `PDM_WEBHOOK_SECRET`
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`
- `GROQ_API_KEY`, `GROQ_MODEL`

---

## 7. Migration

```sql
-- Executar nos 4 bancos: pdm_textil, pdm_pro_textil, pdm_ibirapuera, Neon
CREATE TABLE IF NOT EXISTS crm_whatsapp_flow_logs (
  id SERIAL PRIMARY KEY,
  execution_id UUID NOT NULL,
  remote_jid VARCHAR(255),
  push_name VARCHAR(255),
  step VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_logs_execution_id ON crm_whatsapp_flow_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_flow_logs_created_at ON crm_whatsapp_flow_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_logs_status ON crm_whatsapp_flow_logs(status);
```

---

## 8. Performance e Custos

- **Custo por execução:** ~10 inserts (um por etapa)
- **Retenção:** Pode adicionar cleanup periódico (ex: apagar logs > 30 dias)
- **Índices:** `execution_id` e `created_at` cobrem as consultas principais
- **Impacto no webhook:** +5-10ms por execução (inserts assíncronos)

---

## 9. Fluxo de Dados

```
WhatsApp msg
    │
    ▼
Evolution API (webhook POST)
    │
    ▼
ai-webhook/route.ts
    │
    ├─ logStep("auth", ...)          ──► crm_whatsapp_flow_logs
    ├─ logStep("extract", ...)       ──► crm_whatsapp_flow_logs
    ├─ logStep("filter", ...)        ──► crm_whatsapp_flow_logs
    ├─ logStep("find_conversation", ...) ──► crm_whatsapp_flow_logs
    ├─ logStep("groq_call", ...)     ──► crm_whatsapp_flow_logs
    ├─ logStep("state_machine", ...) ──► crm_whatsapp_flow_logs
    ├─ logStep("save_messages", ...) ──► crm_whatsapp_flow_logs
    ├─ logStep("send_response", ...) ──► crm_whatsapp_flow_logs
    ├─ logStep("create_lead", ...)   ──► crm_whatsapp_flow_logs (se aplicável)
    └─ logStep("notify", ...)        ──► crm_whatsapp_flow_logs (se aplicável)
                                            │
                                            ▼
                                    GET /api/admin/whatsapp-monitor
                                            │
                                            ▼
                                    /admin/whatsapp-monitor (UI)
```
