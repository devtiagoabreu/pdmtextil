# AI Webhook — Bot WhatsApp com IA (Substitui n8n)

**Endpoint:** `POST /api/crm/whatsapp/ai-webhook`

Fluxo conversacional completo que atende leads via WhatsApp usando IA (Groq), coleta dados cadastrais, salva no CRM e notifica representantes. Roda 100% dentro do Next.js, sem dependência do n8n.

## Diagrama do Fluxo

```
WhatsApp ──► Evolution API ──► AI Webhook (POST)
                                    │
                                    ▼
                              ┌─────────────┐
                              │ Autenticar   │  Bearer token ou ?secret=
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Extrair msg  │  remoteJid, pushName, texto
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Filtrar      │  fromMe, vazia, sem remetente
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Buscar       │  crm_whatsapp_conversas
                              │ conversa     │  (ou criar nova + buscar lead)
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Histórico    │  Últimas 30 msgs do banco
                              │ + Groq IA    │  System prompt + contexto
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Máquina de   │  Transição determinística
                              │ estados      │  (regex + keywords)
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Salvar DB    │  Mensagens + estado
                              │ Enviar resp  │  Evolution API → WhatsApp
                              └──────┬──────┘
                                     ▼
                              ┌─────────────┐
                              │ Se finalizou │
                              │  → Lead CRM  │  crm_leads (origem: WHATSAPP)
                              │  → Notifica  │  crm_notificacoes (lead_novo)
                              │  → WhatsApp  │  Representante PJ ou PF
                              └─────────────┘
```

---

## Autenticação

Duas formas (qualquer uma serve):

1. **Header:** `Authorization: Bearer <PDM_WEBHOOK_SECRET>`
2. **Query param:** `?secret=<PDM_WEBHOOK_SECRET>`

---

## Etapas Detalhadas

### 1. Extração de Dados

Parseia o payload da Evolution API (`EvolutionWebhookBody`):

| Campo | Origem | Descrição |
|---|---|---|
| `remoteJid` | `data.key.remoteJid` | JID do remetente (ex: `5519999999999@s.whatsapp.net`) |
| `pushName` | `data.pushName` | Nome do contato no WhatsApp |
| `fromMe` | `data.key.fromMe` | `true` se foi o robô quem enviou |
| `mensagem` | `data.message.conversation` | Texto da mensagem |

Suporta: `conversation`, `extendedTextMessage.text`, `imageMessage.caption`, `documentMessage.caption`, `videoMessage.caption`.

### 2. Filtragem

Ignora e retorna 200 imediatamente:
- `fromMe === true` (mensagens enviadas pelo robô)
- Mensagem vazia (atualização de status, lida, entregue)
- Sem `remoteJid` (eventos de conexão, QR code)

### 3. Gerenciamento de Conversa

**Conversa existente:** Busca em `crm_whatsapp_conversas` por `remoteJid`. Se encontrada, usa o estado e dados salvos.

**Conversa nova:**
1. Busca lead existente no CRM por `idIntegracao = whatsapp:{remoteJid}` ou `celular = numero`
2. Se lead existe com `empresaNome` → estado inicial = `AGUARDANDO_REPRESENTANTE` (ignora mensagens)
3. Se lead existe sem empresa → estado inicial = `COLETANDO_DADOS`
4. Se não existe → estado inicial = `SAUDACAO`
5. Insere nova conversa no banco

**Conversas encerradas:** Se estado é `AGUARDANDO_REPRESENTANTE` ou `ENCERRADO`, retorna `{ status: "ignored" }` e não processa.

### 4. Histórico

Busca últimas 30 mensagens de `crm_whatsapp_mensagens` ordenadas por `created_at DESC`, invertidas para ordem cronológica. Mapeia para o formato `{ role: "user"|"assistant", content: string }`.

### 5. Chamada à IA (Groq)

| Campo | Valor |
|---|---|
| **Endpoint** | `https://api.groq.com/openai/v1/chat/completions` |
| **Modelo** | `GROQ_MODEL` ou `llama-3.3-70b-versatile` |
| **Temperature** | 0.7 |
| **Max tokens** | 300 |

**System prompt** inclui:
- Identidade (Pro Moda Têxtil)
- Fluxo da conversa com todos os estados
- Contexto dinâmico: `{{pushName}}`, `{{estado}}`, `{{dados}}`
- Regras obrigatórias (português natural, 3 linhas máx, uma pergunta por vez)
- Regras proibitórias (sem emojis, sem inventar preços, sem dados de outros clientes)

**Histórico:** Últimos 15 turnos (user/assistant) + mensagem atual do usuário.

### 6. Máquina de Estados

| Estado atual | Condição | Próximo estado | Dados preenchidos |
|---|---|---|---|
| `SAUDACAO` | Sempre | `COLETANDO_NOME` | — |
| `COLETANDO_NOME` | Texto >2 chars alfabéticos | `COLETANDO_DOC` | `dados.nome` |
| `COLETANDO_DOC` | Detecta PF/PJ ou extrai CPF/CNPJ | `CONFIRMACAO` | `dados.tipoPessoa`, `dados.documento` |
| `CONFIRMACAO` | "sim", "s", "ok", "claro", etc. | `ENCERRADO` | `dados.finalizado = true` |
| `ENCERRADO` | Sempre | `ENCERRADO` | `dados.finalizado = true` |

**Funções auxiliares:**
- `extrairDoc(texto)` — regex CPF (`XXX.XXX.XXX-XX`) e CNPJ (`XX.XXX.XXX/XXXX-XX`)
- `detectarTipo(texto)` — keywords: `1/pf/fisica` → PF, `2/pj/juridica/cnpj` → PJ
- `pareceNome(texto)` — remove não-alfabéticos, verifica tamanho >2
- `confirmou(texto)` — regex: `sim|s|ss|claro|ok|confirmo|correto|certo`

### 7. Persistência

| O que | Onde | Quando |
|---|---|---|
| Mensagem recebida | `crm_whatsapp_mensagens` (tipo: `RECEBIDA`) | Sempre |
| Mensagem enviada | `crm_whatsapp_mensagens` (tipo: `ENVIADA`) | Sempre |
| Estado da conversa | `crm_whatsapp_conversas` (upsert por `remoteJid`) | Sempre |

### 8. Envio de Resposta

Chama `enviarMensagem()` de `src/lib/evolution-api.ts` que faz POST para:
```
POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE_NAME}
```
Body: `{ number, text, delay: 1 }`

### 9. Criação de Lead (quando finalizado)

Quando `dados.finalizado === true` e `dados.nome` existe:

1. Verifica se já existe lead com `idIntegracao = whatsapp:{remoteJid}`
2. Se não existe, cria em `crm_leads`:
   - `nome`, `celular`, `documento`, `tipoPessoa`
   - `origem`: `"WHATSAPP"`
   - `idIntegracao`: `"whatsapp:{remoteJid}"`
3. Cria notificação em `crm_notificacoes`:
   - `titulo`: "Novo lead cadastrado via WhatsApp"
   - `tipo`: `"lead_novo"`
   - `link`: `/comercial/crm/leads`
4. Envia WhatsApp para o representante:
   - PJ → `WHATSAPP_REPRESENTANTE_PJ` (default: `5519999999999`)
   - PF → `WHATSAPP_REPRESENTANTE_PF` (default: `5519999999998`)

---

## Tabelas do Banco

| Tabela | Colunas usadas |
|---|---|
| `crm_whatsapp_conversas` | `remote_jid`, `estado`, `dados` (jsonb), `created_at`, `updated_at` |
| `crm_whatsapp_mensagens` | `mensagem`, `tipo` (RECEBIDA/ENVIADA), `status`, `remote_jid`, `created_at` |
| `crm_leads` | `nome`, `celular`, `documento`, `tipo_pessoa`, `origem`, `id_integracao` |
| `crm_notificacoes` | `titulo`, `mensagem`, `tipo`, `link`, `metadados` (jsonb) |

---

## Variáveis de Ambiente

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `PDM_WEBHOOK_SECRET` | Sim | — | Secret para autenticação do webhook |
| `EVOLUTION_API_URL` | Sim | — | URL da Evolution API |
| `EVOLUTION_API_KEY` | Sim | — | API key da Evolution |
| `EVOLUTION_INSTANCE_NAME` | Sim | — | Nome da instância |
| `GROQ_API_KEY` | Sim | — | Chave da API Groq |
| `GROQ_MODEL` | Não | `llama-3.3-70b-versatile` | Modelo Groq |
| `WHATSAPP_REPRESENTANTE_PJ` | Não | `5519999999999` | Número do representante PJ |
| `WHATSAPP_REPRESENTANTE_PF` | Não | `5519999999998` | Número do representante PF |

---

## Configuração na Evolution API

Registrar o webhook com `byEvents: true` e apenas `MESSAGES_UPSERT`:

```bash
curl -X POST https://evolutionapi.tiagoabreu.dev/webhook/set/maketing_pdm_pro_moda \
  -H "apikey: API_KEY_REMOVIDA" \
  -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,"url":"https://pdmprotextil.vercel.app/api/crm/whatsapp/ai-webhook?secret=SEU_SECRET","byEvents":true,"events":["MESSAGES_UPSERT"]}}'
```

---

## Resposta do Endpoint

```json
{
  "status": "ok",
  "estado": "COLETANDO_DOC",
  "leadCriado": false,
  "leadId": null
}
```

Se ignorado (fromMe, vazio, conversa encerrada):
```json
{
  "status": "ignored",
  "reason": "fromMe | empty | no_sender | conversation_ended"
}
```
