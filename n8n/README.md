# Fluxos n8n: WhatsApp Evolution → CRM

## Fluxos disponíveis

| Arquivo | Descrição |
|---|---|
| `../n8n-workflow-atualizado.json` | 🟢 **Produção** — Bot com IA (Groq + Redis), evolui estado, salva no CRM, notifica representantes |
| `whatsapp-bot-ai-agent.json` | 🔴 Antigo — Bot com IA (Groq + Redis), mesmo fluxo sem notificações |
| `whatsapp-bot-atendimento.json` | 🔴 Antigo — Bot de atendimento com conversa guiada (sem IA) |
| `whatsapp-evolution-para-crm.json` | 🔴 Antigo — Encaminhamento simples para o CRM |

> **Arquivo principal de produção:** `n8n-workflow-atualizado.json` — documentação completa em `n8n-workflow.md`. Os demais estão inativos.

---

## Fluxo 1: Encaminhamento Simples (`whatsapp-evolution-para-crm.json`)

Recebe mensagens do WhatsApp e envia direto para o CRM, criando lead automaticamente.

```
Evolution → n8n Webhook → Extrair dados → Filtrar → Enviar para CRM
```

### Como configurar

1. **Importar**: n8n → Workflows → Import from File → selecione o arquivo
2. **Acessar**: Vá em Settings → Environment Variables no n8n e adicione:
   - `WHATSAPP_WEBHOOK_SECRET`: `pdm-secret-2024` (ou o valor definido na Vercel)
3. **Ativar e copiar URL**: Abra o workflow, clique no nó **Receber do Evolution** e copie a Webhook URL
4. **Registrar na Evolution**: Execute o comando abaixo com a URL copiada

> ⚠️ O `byEvents` deve ser **`true`** para evitar que a Evolution envie todos os tipos de evento (conexão, QR code, etc.). Com `byEvents: true`, apenas `MESSAGES_UPSERT` é disparado.

```bash
curl -X POST https://evolutionapi.tiagoabreu.dev/webhook/set/maketing_pdm_pro_moda \
  -H "apikey: evolution_apikey_dqgh3ffrdg" \
  -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,"url":"WEBHOOK_URL_AQUI","byEvents":true,"events":["MESSAGES_UPSERT"]}}'
```

### Gerenciamento do Webhook (Evolution API)

**Servidor:** `https://evolutionapi.tiagoabreu.dev` (Cloudflare, IP `104.21.92.117`)  
**Instância:** `maketing_pdm_pro_moda`  
**API Key (global):** `evolution_apikey_dqgh3ffrdg` (via `.env.local`)  
**API Key (n8n):** salva como credencial `Evolution account` no n8n

#### Endpoints úteis

| Ação | Comando |
|------|---------|
| **Ver webhook atual** | `curl -s -X GET "https://evolutionapi.tiagoabreu.dev/webhook/find/maketing_pdm_pro_moda" -H "apikey: evolution_apikey_dqgh3ffrdg"` |
| **Alterar webhook** | `curl -s -X POST "https://evolutionapi.tiagoabreu.dev/webhook/set/maketing_pdm_pro_moda" -H "apikey: evolution_apikey_dqgh3ffrdg" -H "Content-Type: application/json" -d @payload.json` |
| **Testar envio manual** | `curl -s -X POST "https://evolutionapi.tiagoabreu.dev/message/sendText/maketing_pdm_pro_moda" -H "apikey: evolution_apikey_dqgh3ffrdg" -H "Content-Type: application/json" -d "{\"number\":\"5519999999999\",\"textMessage\":{\"text\":\"teste\"}}"` |
| **Listar instâncias** | `curl -s -X GET "https://evolutionapi.tiagoabreu.dev/instance/fetchInstances" -H "apikey: evolution_apikey_dqgh3ffrdg"` |

#### Observações
- Use `curl.exe` (não `curl`) no PowerShell do Windows para evitar erro `URL rejected: Bad hostname`
- O header de autenticação é `apikey` (minúsculo, sem `Bearer`)
- A API key do `.env.local` (`evolution_apikey_dqgh3ffrdg`) é a global. A `E7CFC0D4875D-46F3-BF90-3946AAD1917A` (usada em workflows antigos) é token de instância.
- Para alterar o webhook, salve o JSON num arquivo (`payload.json`) e use `-d @payload.json` para evitar problemas de escaping:

---

## Fluxo 2: Bot de Atendimento (`whatsapp-bot-atendimento.json`)

🤖 Fluxo conversacional completo com saudação, qualificação do lead e cadastro no CRM.

### Fluxo da conversa

```
1️⃣ SAUDACAO → Apresenta a Pro MODA Têxtil e pergunta se é PJ
2️⃣ VALIDANDO_PJ → Se não for PJ, encerra. Se for, solicita dados
3️⃣ COLETANDO_DADOS → Coleta Razão Social, CNPJ e nome de contato
4️⃣ PERGUNTANDO_PRODUTOS → Pergunta se conhece os produtos
5️⃣ MOSTRANDO_PRODUTOS → Mostra as linhas (Hospitalar, WorkWear, Decoração, etc.)
6️⃣ AGUARDANDO_REPRESENTANTE → Informa que representante vai contatar em 5min → CRIA LEAD NO CRM
```

### Como configurar

1. **Importar** o `whatsapp-bot-atendimento.json` no n8n
2. **Desativar** o fluxo antigo (se estiver ativo)
3. **Ativar** o bot e copiar a Webhook URL do nó **Receber do Evolution**
4. **Registrar na Evolution** (mesmo comando do Fluxo 1, mas com a nova URL)
5. **Reiniciar** a instância no dashboard da Evolution

### Personalizar mensagens

Edite o nó **Bot Conversacional** (Function node) no n8n. Os estados estão em um `switch`:

- `SAUDACAO` → Mensagem inicial
- `VALIDANDO_PJ` → Validação de pessoa jurídica
- `COLETANDO_DADOS` → Coleta de dados
- `PERGUNTANDO_PRODUTOS` → Pergunta sobre produtos
- `MOSTRANDO_PRODUTOS` → Lista de produtos + encaminha para representante

### Requisitos

- A tabela `crm_whatsapp_conversas` precisa existir no banco (já foi criada)
- Certifique-se de que o secret no n8n e na Vercel sejam `pdm-secret-2024`
