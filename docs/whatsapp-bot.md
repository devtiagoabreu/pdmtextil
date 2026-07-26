# Bot de WhatsApp IA - Pro Moda Textil

## Visao Geral

O bot de WhatsApp da Pro Moda Textil e um atendente virtual que coleta dados de clientes, consulta CNPJ, envia catalogos e roteia leads para representantes comerciais. Ele opera via Evolution API (envio/recebimento de mensagens), Groq API (processamento de linguagem natural) e persiste tudo em PostgreSQL via Drizzle ORM.

---

## Arquitetura

```
WhatsApp (cliente)
    │
    ▼
Evolution API (webhook)
    │
    ▼
POST /api/crm/whatsapp/ai-webhook/route.ts
    │
    ├── 1. Extrair mensagem, remoteJid, pushName
    ├── 2. Filtrar: fromMe, midia, mensagem vazia
    ├── 3. Buscar/criar conversa no DB (crm_whatsapp_conversas)
    ├── 4. Verificar TTL (24h) → resetar se expirada
    ├── 5. Detectar "reiniciar" → resetar conversa
    ├── 6. Detectar "atendente/humano" → escalar para representante
    ├── 7. Buscar linhas ativas do DB → montar linhaMap
    ├── 8. Chamar Groq API (llama-3.3-70b-versatile) com system prompt dinamico
    ├── 9. Executar maquina de estados (validar resposta do usuario)
    ├── 10. Salvar mensagens no DB (crm_whatsapp_mensagens)
    ├── 11. Enviar resposta via Evolution API
    ├── 12. Se CONFIRMACAO: enviar catalogos (crm_whatsapp_catalogos)
    ├── 13. Se finalizado: criar lead (crm_leads) + notificar representante
    └── 14. Salvar log de execucao (crm_whatsapp_flow_logs)
```

---

## Tabelas do Banco de Dados

| Tabela | Descricao |
|---|---|
| `crm_whatsapp_conversas` | Estado da conversa por remoteJid (estado, dados JSONB, timestamps) |
| `crm_whatsapp_mensagens` | Historico de mensagens (tipo: RECEBIDA/ENVIADA, status, remoteJid) |
| `crm_whatsapp_linhas` | Linhas de tecidos disponiveis (numero, nome, ativo) |
| `crm_whatsapp_catalogos` | Catalogos por linha e tipoPessoa (titulo, linkUrl, descricao, ativo) |
| `crm_whatsapp_flow_logs` | Logs de cada execucao do bot (step, status, input, output, durationMs) |
| `crm_leads` | Leads criados pelo bot (nome, celular, documento, tipoPessoa, origem) |
| `crm_notificacoes` | Notificacoes enviadas ao representante (titulo, mensagem, tipo, metadados) |

---

## Maquina de Estados

O bot opera como uma maquina de estados. Cada mensagem do cliente avanca ou mantem o estado atual.

```
SAUDACAO → COLETANDO_NOME → COLETANDO_DOC → COLETANDO_INTERESSE → CONFIRMACAO → ENCERRADO
                  │                │
                  │                ▼
                  │         CONFIRMANDO_TIPO_PESSOA (se PF digitou CNPJ)
                  │                │
                  │                ▼
                  │         CONFIRMANDO_DADOS_CNPJ (pos-consulta API)
                  │
                  ▼
            AGUARDANDO_REPRESENTANTE (escalamacao / bloqueio)
                  │
                  ▼
            HUMANO_ASSUMINDO (representante assumiu no chat)
```

### Descricao de cada estado

| Estado | O que acontece | Transicao para |
|---|---|---|
| `SAUDACAO` | Bot se apresenta e pergunta "Qual o seu nome?" | `COLETANDO_NOME` |
| `COLETANDO_NOME` | Extrai nome proprio, confirma "Prazer em te conhecer, [NOME]!" | `COLETANDO_DOC` |
| `COLETANDO_DOC` | Pergunta PF/PJ e solicita CPF/CNPJ | `COLETANDO_INTERESSE`, `CONFIRMANDO_TIPO_PESSOA` ou `CONFIRMANDO_DADOS_CNPJ` |
| `CONFIRMANDO_TIPO_PESSOA` | Detectou mismatch PF vs CNPJ. Pergunta se pode seguir como PJ | `CONFIRMANDO_DADOS_CNPJ` ou `AGUARDANDO_REPRESENTANTE` |
| `CONFIRMANDO_DADOS_CNPJ` | Consulta API OpenCNPJ, mostra dados e pede confirmacao | `COLETANDO_INTERESSE` ou `AGUARDANDO_REPRESENTANTE` |
| `COLETANDO_INTERESSE` | Mostra linhas disponiveis, cliente escolhe por numero ou nome | `CONFIRMACAO` |
| `CONFIRMACAO` | Mostra resumo de todos os dados, pede SIM para confirmar | `ENCERRADO` |
| `ENCERRADO` | Envia catalogos, cria lead, notifica representante | Fim |
| `AGUARDANDO_REPRESENTANTE` | Bot para de responder. Cliente aguarda contato humano | `HUMANO_ASSUMINDO` (via chat) |
| `HUMANO_ASSUMINDO` | Bot ignora mensagens. Representante conversa pelo chat CRM | `SAUDACAO` (via "Devolver ao Bot") |

---

## Validacao por Estado

O bot valida as respostas do usuario em cada estado. Valores invalidos sao rejeitados.

### COLETANDO_NOME — `rejeitarNome()`

Rejeita:
- Numeros puros (`"123"`)
- Idades (`"25 anos"`, `"tenho 30"`)
- Frases incompletas (`"meu nome"`, `"sou o"`)
- Respostas evasivas (`"nao sei"`, `"tanto faz"`, `"ok"`, `"sim"`)
- Documentos no lugar do nome (`"cpf"`, `"cnpj"`)
- Perguntas fora do fluxo (`"quanto custa"`, `"preco"`)
- Saudacoes sem nome (`"oi"`, `"bom dia"` — so se tiver 3+ palavras aceita)

### COLETANDO_DOC

- Detecta tipo (PF/PJ) por palavras-chave: `"pessoa fisica"`, `"pj"`, `"cnpj"`, `"1"`, `"2"`
- Extrai documento por regex: CPF (11 digitos) ou CNPJ (14 digitos)
- Se escolheu PF mas digitou CNPJ → vai para `CONFIRMANDO_TIPO_PESSOA`
- Se escolheu PJ e digitou CNPJ → faz lookup na API OpenCNPJ

### CONFIRMANDO_TIPO_PESSOA

- Confirmou (`"sim"`, `"pode ser"`, `"claro"`) → segue como PJ, faz lookup CNPJ
- Negou (`"nao"`, `"quero PF"`) → redireciona para representante PF

### CONFIRMANDO_DADOS_CNPJ

- Confirmou → avanca para `COLETANDO_INTERESSE`
- Negou → redireciona para representante PF

### COLETANDO_INTERESSE

- Aceita numeros separados por virgula (`"1,3"`, `"2"`)
- Aceita nomes das linhas (`"malha"`, `"jeans"`)
- Aceita "todos/todas/tudo" → seleciona todas as linhas
- Maximo 3 tentativas invalidas → bloqueia

### CONFIRMACAO

- `"sim"` → finaliza, envia catalogos, cria lead
- `"nao"` → volta para `COLETANDO_NOME` (reinicia dados)

---

## Protecoes e Controle de Repeticao

Cada estado possui um contador `_tentativas` (maximo 3). Quando excedido:

- `_bloqueado = true`
- `_motivoBloqueio` registra o motivo (ex: `"nome_invalido_repetido"`)
- Cliente e redirecionado para representante comercial
- Lead e sempre criado (mesmo com nome "Anonimo")
- Representante e notificado via WhatsApp

---

## Lookup de CNPJ

Quando o cliente informa um CNPJ, o bot consulta a API externa:

```
GET https://api.opencnpj.org/{cnpj}
```

Retorna: razao social, nome fantasia, situacao cadastral, endereco.

**Fluxo de falha:**
1. Primeira falha → pede para o cliente verificar o numero
2. Segunda falha → assume CNPJ correto, pergunta se pode seguir como PJ
3. Se o cliente confirmou PF mas digitou CNPJ → vai para `CONFIRMANDO_TIPO_PESSOA`

---

## Notificacoes ao Representante

O bot sempre notifica o representante quando:
- Lead e finalizado (estado `ENCERRADO`)
- Cliente solicitou atendimento humano (escalamacao)
- Cliente foi bloqueado por invalidacoes repetidas
- Cliente redirecionado (recusou corrigir PF/PJ)

A notificacao vai para:
- **PF:** `WHATSAPP_REPRESENTANTE_PF` (default: 5519999999998)
- **PJ:** `WHATSAPP_REPRESENTANTE_PJ` (default: 5519999999999)

A notificacao contem: nome do lead, link WhatsApp, tipo (PF/PJ), documento, linhas de interesse.

**O bot NUNCA envia o numero do representante para o cliente.**

---

## Melhorias Implementadas

### 1. TTL de Conversa (24h)
Conversas abandonadas por mais de 24h sao automaticamente reiniciadas para o estado `SAUDACAO`. Excecao: conversas em `HUMANO_ASSUMINDO` nao sao resetadas.

### 2. Escalacao para Humano
Detecta palavras como "atendente", "humano", "pessoa", "representante", "suporte", "admin", "gerente". Redireciona para `AGUARDANDO_REPRESENTANTE` e notifica o representante.

### 3. Tratamento de Midia
Quando o cliente envia imagem, audio, sticker ou video, o bot responde: "No momento consigo apenas ler mensagens de texto. Por favor, digite sua resposta."

### 4. Groq Falha → Nao Avanca Estado
Se a API Groq retorna erro, o bot envia "Tive uma dificuldade tecnica. Pode repetir sua mensagem, por favor?" e mantem o estado atual. Nao avanca a maquina de estados.

### 5. Comando "Reiniciar"
Detecta "reiniciar", "recomecar", "do zero", "resetar", "limpar". Reseta a conversa para `SAUDACAO` com dados zerados.

### 6. Estado HUMANO_ASSUMINDO
Quando o representante assume a conversa via chat CRM, o bot para de responder. O cliente so recebe mensagens do representante. Ao clicar "Devolver ao Bot", volta para `SAUDACAO`.

---

## Chat CRM

### API — `/api/crm/whatsapp/chat`

| Metodo | Descricao |
|---|---|
| `GET?remoteJid=...` | Retorna mensagens, conversa e lead |
| `POST { remoteJid, mensagem }` | Envia mensagem manual do representante via Evolution API |
| `POST { remoteJid, mensagem, modo: "assumir" }` | Assume conversa → estado `HUMANO_ASSUMINDO` |
| `POST { remoteJid, mensagem, modo: "devolver_bot" }` | Devolve ao bot → estado `SAUDACAO` |

### Pagina — `/admin/whatsapp-chat`

- Sidebar com lista de conversas (ultima mensagem, nao lidas)
- Chat com historico de mensagens (bubbles azuis = bot, brancas = cliente)
- Botao "Assumir" → representante assume a conversa
- Botao "Devolver ao Bot" → retorna controle ao bot
- Auto-refresh a cada 5 segundos
- Link direto para o lead no CRM

---

## Monitor WhatsApp — `/admin/whatsapp-monitor`

Exibe execucoes do bot em tempo real com diagrama de fluxo:

- Cada recebimento de mensagem gera uma `executionId`
- Cada etapa (auth, extract, filter, groq_call, state_machine, etc.) e logada com status, duracao e dados de input/output
- Fluxo visual mostra sucesso/erro de cada etapa
- Auto-refresh configuravel

---

## Configuracao

### Variaveis de Ambiente

| Variavel | Descricao |
|---|---|
| `GROQ_API_KEY` | Chave da API Groq para processamento de IA |
| `GROQ_MODEL` | Modelo Groq (default: `llama-3.3-70b-versatile`) |
| `EVOLUTION_API_URL` | URL da instancia Evolution API |
| `EVOLUTION_API_KEY` | Chave da API Evolution |
| `EVOLUTION_INSTANCE_NAME` | Nome da instancia Evolution |
| `WHATSAPP_REPRESENTANTE_PF` | Numero do representante Pessoa Fisica |
| `WHATSAPP_REPRESENTANTE_PJ` | Numero do representante Pessoa Juridica |

### Linhas e Catalogos

Linhas sao gerenciadas via `/admin/whatsapp-catalogos`:
- **Linhas:** numero + nome (ex: `1 - Malha`, `2 - Jean`)
- **Catalogos:** titulo + link + descricao, filtrados por linha e tipoPessoa (PF/PJ/AMBOS)
- O bot monta o prompt dinamicamente com as linhas ativas do banco

---

## Fluxo Completo (Exemplo)

```
Cliente: "Ola"
Bot: "Ola! Sou o assistente virtual da Pro Moda Textil. Qual o seu nome?"

Cliente: "Maria"
Bot: "Prazer em te conhecer, Maria! Voce e pessoa fisica ou juridica? Digite: 1 - PF, 2 - PJ"

Cliente: "2"
Bot: "Informe o seu CNPJ."

Cliente: "12345678000190"
Bot: [Consulta API OpenCNPJ] "Encontrei: Textil ABC Ltda (Situacao: Ativa). Esses dados estao corretos?"

Cliente: "Sim"
Bot: "Todas as nossas linhas sao de tecidos planos. Qual delas te interessa? 1 - Malha, 2 - Jean, 3 - Tecidos Hospitalares"

Cliente: "1,3"
Bot: "Otimo! Voce tem interesse nas linhas: Malha, Tecidos Hospitalares."

Bot: "Aqui esta o resumo:\nNome: Maria\nDocumento: 12345678000190\nTipo: PJ\nInteresse: Malha, Tecidos Hospitalares\nEsta correto?"

Cliente: "Sim"
Bot: [ENVIA CATALOGOS das linhas 1 e 3]
Bot: "Um representante comercial entrara em contato em ate 10 minutos. Obrigado!"
Bot: [CRIA LEAD no CRM]
Bot: [NOTIFICA REPRESENTANTE PJ via WhatsApp]
```

---

## Arquivos Principais

| Arquivo | Descricao |
|---|---|
| `src/app/api/crm/whatsapp/ai-webhook/route.ts` | Webhook principal do bot (1164 linhas) |
| `src/app/api/crm/whatsapp/chat/route.ts` | API de chat manual (envio + assumir/devolver) |
| `src/app/api/crm/whatsapp/conversas/route.ts` | Lista de conversas |
| `src/app/api/crm/whatsapp/conversa/route.ts` | Detalhe/criacao de conversa |
| `src/app/(dashboard)/admin/whatsapp-chat/page.tsx` | Pagina de chat CRM |
| `src/app/(dashboard)/admin/whatsapp-monitor/page.tsx` | Monitor de execucoes |
| `src/app/(dashboard)/admin/whatsapp-catalogos/page.tsx` | Gerenciamento de linhas/catalogos |
| `src/lib/evolution-api.ts` | Envio de mensagens via Evolution API |
| `src/lib/db/schema/crm-whatsapp-conversas.ts` | Schema da tabela de conversas |
| `src/lib/db/schema/crm-whatsapp.ts` | Schema da tabela de mensagens |
| `src/lib/db/schema/crm-whatsapp-linhas.ts` | Schema da tabela de linhas |
| `src/lib/db/schema/crm-whatsapp-catalogos.ts` | Schema da tabela de catalogos |
| `src/lib/db/schema/crm-whatsapp-flow-logs.ts` | Schema da tabela de logs |
| `src/lib/db/schema/crm-leads.ts` | Schema da tabela de leads |
| `src/lib/db/schema/crm-notificacoes.ts` | Schema da tabela de notificacoes |

---

## Commits

| Hash | Descricao |
|---|---|
| `2e13080` | Linhas dinamicas do banco |
| `e401475` | Prompt dinamico com buildSystemPrompt |
| `f0800ca` | Validacao por estado + rejeitarNome |
| `71607fa` | Controle de repeticao (MAX_TENTATIVAS) |
| `386b837` | CNPJ/PF mismatch + CONFIRMANDO_TIPO_PESSOA |
| `30c6721` | Lookup de CNPJ via API OpenCJPJ |
| `645e82b` | Lead sempre criado + notificacao ao representante |
| `6dffba3` | Bloqueio/redirect para PF + motivo |
| `8b7a050` | Sem WhatsApp do representante para o cliente |
| `db755ab` | Commits intermediarios |
| `6e64e3f` | Fix build: dados → metadados em crmNotificacoes |
