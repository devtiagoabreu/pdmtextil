# Fluxo n8n: WhatsApp Evolution → CRM

## Como importar

1. Abra seu n8n
2. Vá em **Workflows** → **Import from File**
3. Selecione o arquivo `whatsapp-evolution-para-crm.json`
4. Clique em **Import**

## Configurar variáveis de ambiente no n8n

Antes de ativar, configure as seguintes variáveis no n8n:

| Variável | Valor | Onde conseguir |
|---|---|---|
| `WHATSAPP_WEBHOOK_SECRET` | Mesmo valor configurado no Vercel | Gerado durante a configuração |
| `CRM_WEBHOOK_URL` | `https://pdmprotextil.vercel.app/api/crm/whatsapp/webhook` | URL do seu deploy |

## Configurar webhook no n8n

Após importar e configurar as env vars:

1. Abra o workflow
2. Clique no nó **Receber do Evolution**
3. Copie a **Webhook URL** gerada (algo como `https://seu-n8n.com/webhook/whatsapp-evolution`)
4. Ative o workflow

## Configurar Evolution API para enviar webhooks para o n8n

No terminal ou dashboard da Evolution API, registre a URL do n8n como webhook:

```
curl -X POST https://evolutionapi.tiagoabreu.dev/webhook/set/maketing_pdm_pro_moda \
  -H "apikey: E7CFC0D4875D-46F3-BF90-3946AAD1917A" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://seu-n8n.com/webhook/whatsapp-evolution",
    "webhookByEvents": true
  }'
```

Substitua `https://seu-n8n.com/webhook/whatsapp-evolution` pela URL gerada no n8n.

## Fluxo

```
Evolution API → n8n Webhook → Filtrar → Ignorar próprias mensagens → CRM Webhook
```

1. **Receber do Evolution**: Escuta as mensagens enviadas pela Evolution API
2. **Filtrar e Transformar**: Extrai número, texto e ID da mensagem
3. **Ignorar próprias mensagens**: Descarta mensagens enviadas pelo próprio sistema
4. **Enviar para CRM**: Envia para o webhook do CRM com `?createLead=true`

Se o número for desconhecido, o CRM cria automaticamente:
- Um lead (origem WHATSAPP)
- Uma empresa
- Um contato vinculado
