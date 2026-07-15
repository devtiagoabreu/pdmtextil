# Fluxo n8n — Bot WhatsApp com IA (Produção)

**Arquivo:** `n8n-workflow-atualizado.json`

## Visão Geral

Fluxo conversacional com IA (Groq + Redis) que atende leads via WhatsApp, coleta dados cadastrais, salva no CRM e notifica os representantes.

## Diagrama do Fluxo

```
WhatsApp ──► Evolution API ──► 1. Receber do Evolution
                   (byEvents:true)    │
                                      ▼
                                2. Extrair dados
                                      │
                                      ▼
                                3. Filtrar evento 🔒
                               (fromMe/ vazio/ sem remetente)
                                      │
                                      ▼
                                4. Listar contatos
                                      │
                                      ▼
                                5. Combinar dados
                                      │
                                      ▼
                                6. Buscar conversa
                                      │
                                      ▼
                                7. Filtrar e estado inicial
                               │           │
                               ▼           ▼
                     7. IA Atendente    8. Merge dados
                      (Groq + Redis)         │
                               │              │
                               └──────┬───────┘
                                      ▼
                                9. Maquina de estados
                                      │
                                      ▼
                                10. Enviar WhatsApp
                                      │
                                      ▼
                                11. Salvar estado
                                      │
                                      ▼
                                12. Preparar notificacao
                                      │
                                      ▼
                                13. Salvar notificacao no CRM
                                      │
                                      ▼
                                14. Enviar notificacao
```

---

## Nó a Nó

### 1. Receber do Evolution

| Campo | Valor |
|---|---|
| **Tipo** | Webhook |
| **Path** | `whatsapp-evolution` |
| **Método HTTP** | POST |
| **Response Mode** | lastNode |

Recebe o POST enviado pela Evolution API quando chega uma mensagem no WhatsApp (`MESSAGES_UPSERT`).

---

### 2. Extrair dados

| Campo | Valor |
|---|---|
| **Tipo** | Function |
| **Entrada** | Webhook body |

Extrai campos do payload da Evolution:
- `pushName` — nome do contato no WhatsApp
- `remetente` — JID completo (ex: `5519999999999@s.whatsapp.net`)
- `fromMe` — booleano, `true` se foi o robô quem enviou
- `msg` — texto da mensagem (conversation, extendedTextMessage, caption de mídia)
- `msgType` — tipo da mensagem

---

### 3. Filtrar evento 🔒

| Campo | Valor |
|---|---|
| **Tipo** | Function |

Filtro de segurança logo após a extração, **antes** de qualquer chamada externa (Evolution API, CRM):
1. **Ignora mensagens enviadas pelo robô** (`fromMe === true`) → retorna `[null]`
2. **Ignora mensagens vazias** (status update, lida, entregue, etc.) → retorna `[null]`
3. **Ignora eventos sem remetente** (conexão, QR code, etc.) → retorna `[null]`

Quando retorna `[null]`, os nós seguintes não executam, economizando chamadas à Evolution API e ao CRM.

---

### 4. Listar contatos

| Campo | Valor |
|---|---|
| **Tipo** | Evolution API — Find Contacts |
| **Instância** | `maketing_pdm_pro_moda` |

Lista todos os contatos da instância Evolution para verificar se o remetente já é conhecido.

---

### 5. Combinar dados

| Campo | Valor |
|---|---|
| **Tipo** | Function |

Compara o número do remetente com a lista de contatos do Evolution e define `contatoConhecido: true/false`. Mantém todos os dados extraídos no passo anterior.

---

### 6. Buscar conversa

| Campo | Valor |
|---|---|
| **Tipo** | HTTP Request (GET) |
| **URL** | `https://pdmprotextil.vercel.app/api/crm/whatsapp/conversa?remoteJid={{ $json.remetente }}` |
| **continueOnFail** | true |

Busca no banco CRM se já existe uma conversa ativa para aquele `remoteJid`. Retorna o estado atual (`SAUDACAO`, `COLETANDO_NOME`, etc.) e os dados já coletados.

---

### 7. Filtrar e estado inicial

| Campo | Valor |
|---|---|
| **Tipo** | Function |

Filtro de segurança redundante (já filtrado no nó 3, mas mantido caso o fluxo mude):
1. **Ignora mensagens enviadas pelo robô** (`fromMe === true`) → retorna `[null]`
2. **Ignora mensagens vazias** → retorna `[null]`

Para mensagens válidas, monta o objeto com `remetente`, `numero` (limpo), `msg`, `estado`, `dados` e `conversaId`.

---

### 8. IA Atendente

| Campo | Valor |
|---|---|
| **Tipo** | AI Agent (LangChain) |
| **Model** | Groq — `compound-mini` |
| **Memória** | Redis Chat Memory (TTL 3600s, janela 15 turnos) |
| **System Message** | Prompt completo em português |

Agente conversacional que conduz o lead pelos estados:
1. **SAUDACAO** — Pergunta o nome
2. **COLETANDO_NOME** — Extrai o nome próprio
3. **COLETANDO_INTERESSE** — Pergunta a linha de tecido (Lençol, Hospitalar, Lateral de Colchão, Rústicos/Decoração, Movelaria/Forros)
4. **COLETANDO_DOC** — Pergunta PF ou PJ, coleta CPF/CNPJ
5. **CONFIRMACAO** — Mostra resumo e pede confirmação
6. **ENCERRADO** — Informa que representante vai contatar

Dependências:
- **Groq Chat Model** (credencial: `Groq account`)
- **Redis Chat Memory** (credencial: `Redis account`) — chave `session: {{ $json.remetente }}`

---

### 9. Merge dados

| Campo | Valor |
|---|---|
| **Tipo** | Merge |
| **Modo** | Combine — Merge by Position |

Combina a saída do **Filtrar e estado inicial** (dados crus) com a resposta da **IA Atendente** (output da IA + dados do estado). Ambos seguem em paralelo, unidos por posição.

---

### 10. Maquina de estados

| Campo | Valor |
|---|---|
| **Tipo** | Function |

Implementa a lógica de transição de estados real (não apenas a sugestão da IA):
- Extrai documento (CPF/CNPJ) por regex
- Detecta tipo (PF/PJ) por palavra-chave
- Valida confirmação ("sim", "s", "ok", etc.)
- Controla `nextEstado` e preenche `dados` progressivamente

Quando o lead chega em **CONFIRMACAO** com confirmação positiva, define `dados.finalizado = true`, que é a condição para o fluxo de notificação disparar.

---

### 11. Enviar WhatsApp

| Campo | Valor |
|---|---|
| **Tipo** | Evolution API — Send Text Message |
| **Instância** | `maketing_pdm_pro_moda` |
| **remoteJid** | `{{ $json.remetente }}` |
| **messageText** | `{{ $json.resposta }}` |

Envia a resposta gerada pela **IA Atendente** + **Maquina de estados** de volta para o lead no WhatsApp.

---

### 12. Salvar estado

| Campo | Valor |
|---|---|
| **Tipo** | HTTP Request (POST) |
| **URL** | `https://pdmprotextil.vercel.app/api/crm/whatsapp/conversa` |

Persiste o estado atual da conversa no banco CRM (estado, dados coletados, última mensagem). Envia:
- `remoteJid`, `numero`, `pushName`
- `estado`, `dados`, `msg`, `resposta`

---

### 13. Preparar notificacao

| Campo | Valor |
|---|---|
| **Tipo** | Function |
| **Condição** | Executa apenas se `dados.finalizado === true` |

Gera a mensagem de notificação para os representantes:
- Se **PJ** → envia para `5519983530400@s.whatsapp.net`
- Se **PF** → envia para `5519981815930@s.whatsapp.net`
- Monta texto com nome, telefone, tipo, documento

Se `finalizado !== true`, retorna `[null]` e encerra o fluxo.

---

### 14. Salvar notificacao no CRM

| Campo | Valor |
|---|---|
| **Tipo** | HTTP Request (POST) |
| **URL** | `https://pdmprotextil.vercel.app/api/crm/notificacoes` |
| **continueOnFail** | true |

Cria um registro na central de notificações do CRM:
- `titulo`: "Novo lead cadastrado via WhatsApp"
- `mensagem`: texto da notificação
- `tipo`: `lead_novo`
- `link`: `/comercial/crm/leads`

---

### 15. Enviar notificacao

| Campo | Valor |
|---|---|
| **Tipo** | Evolution API — Send Text Message |
| **Instância** | `maketing_pdm_pro_moda` |
| **remoteJid** | `{{ $json.targetJid }}` |
| **messageText** | `{{ $json.messageText }}` |

Envia a notificação de novo lead para o WhatsApp do representante responsável (PF ou PJ).

---

## Dependências Externas

| Serviço | Função | Credencial no n8n |
|---|---|---|
| **Evolution API** | Envio/recepção de mensagens WhatsApp | `Evolution account` |
| **Groq** | Modelo de IA (`compound-mini`) | `Groq account` |
| **Redis** | Memória de sessão (TTL 1h) | `Redis account` |
| **Vercel (pdmprotextil)** | API do CRM (conversa + notificações) | — |

## Endpoints da API do CRM usados

| Método | URL | Função |
|---|---|---|
| `GET` | `/api/crm/whatsapp/conversa?remoteJid=...` | Buscar estado da conversa |
| `POST` | `/api/crm/whatsapp/conversa` | Salvar estado da conversa |
| `POST` | `/api/crm/notificacoes` | Criar notificação no CRM |
