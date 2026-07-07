const fs = require("fs");
const d = JSON.parse(fs.readFileSync("n8n/whatsapp-bot-atendimento.json", "utf8"));

// Remove "Buscar contato" and "Extrair numero" nodes (abordagem de contatos não serve)
const removeIds = ["fetch-contacts", "extract-number"];
d.nodes = d.nodes.filter(n => !removeIds.includes(n.id));
delete d.connections["Buscar contato"];
delete d.connections["Extrair numero"];

// Reconnect: Salvar estado → Enviar resposta WhatsApp (como antes)
d.connections["Salvar estado"].main[0] = [{
  node: "Enviar resposta WhatsApp",
  type: "main",
  index: 0
}];

// Fix Enviar resposta WhatsApp: usar endpoint /message/sendMessage em vez de sendText
// E enviar o @lid como number (sendMessage pode não ter o exists check)
const send = d.nodes.find(x => x.id === "send-response");
send.parameters.url = "https://evolutionapi.tiagoabreu.dev/message/sendMessage/maketing_pdm_pro_moda";
send.parameters.bodyParameters = {
  parameters: [
    { name: "number", value: '={{ $items("Bot Conversacional")[0].json.numero }}' },
    { name: "text", value: '={{ $items("Bot Conversacional")[0].json.mensagem }}' },
    { name: "mediatype", value: "text" },
    { name: "options.delay", value: "1000" }
  ]
};

// Fix headers
send.parameters.sendHeaders = true;
send.parameters.headerParameters = {
  parameters: [
    { name: "apikey", value: "E7CFC0D4875D-46F3-BF90-3946AAD1917A" }
  ]
};
delete send.parameters.options.headers;

// Fix Lead pronto? filter
const filter = d.nodes.find(x => x.id === "filter-lead");
filter.parameters.conditions.boolean[0].value1 = '={{ $items("Bot Conversacional")[0].json.leadPronto }}';

// Fix Criar Lead CRM
const crm = d.nodes.find(x => x.id === "create-lead");
crm.parameters.bodyParameters.parameters[0].value = '={{ $items("Bot Conversacional")[0].json.remoteJid }}';
crm.parameters.bodyParameters.parameters[1].value = '={{ "Lead qualificado via bot - " + ($items("Bot Conversacional")[0].json.dados ? ($items("Bot Conversacional")[0].json.dados.razaoSocial || "") : "") }}';

// Extrair dados: mantem @lid, nao tenta resolver
const ex = d.nodes.find(x => x.id === "extract-data");
ex.parameters.functionCode = `const item = $input.first().json;
const body = item.body || item;
const data = body.data || {};
const key = data.key || {};

const remoteJid = key.remoteJid || body.remoteJid || "";
const fromMe = key.fromMe === true;
if (fromMe || body.event !== "messages.upsert") {
  return [null];
}

const msg = data.message || {};
const mensagem = msg.conversation
  || msg.extendedTextMessage?.text
  || msg.imageMessage?.caption
  || msg.documentMessage?.caption
  || msg.videoMessage?.caption
  || "";

if (!mensagem) {
  return [null];
}

// Mantem @lid como numero (sendMessage pode aceitar)
const numero = remoteJid;
const pushName = data.pushName || body.pushName || "";

return [{
  json: { remoteJid, numero, mensagem, pushName }
}];`;

fs.writeFileSync("n8n/whatsapp-bot-atendimento.json", JSON.stringify(d, null, 2));
console.log("✓ Removed contact resolution, trying /message/sendMessage endpoint");
