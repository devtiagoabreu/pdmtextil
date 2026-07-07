const fs = require("fs");
const d = JSON.parse(fs.readFileSync("n8n/whatsapp-bot-atendimento.json", "utf8"));

// Fix "Enviar resposta WhatsApp"
const send = d.nodes.find(x => x.id === "send-response");
send.parameters.sendHeaders = true;
send.parameters.headerParameters = {
  parameters: [
    { name: "apikey", value: "E7CFC0D4875D-46F3-BF90-3946AAD1917A" }
  ]
};
delete send.parameters.options.headers;
const botRef = '={{ $items("Bot Conversacional")[0].json.';
send.parameters.bodyParameters.parameters[0].value = botRef + 'numero }}';
send.parameters.bodyParameters.parameters[1].value = botRef + 'mensagem }}';

// Fix "Lead pronto?" filter to reference Bot Conversacional
const filter = d.nodes.find(x => x.id === "filter-lead");
if (filter) {
  filter.parameters.conditions.boolean[0].value1 = botRef + 'leadPronto }}';
}

// Fix "Criar Lead CRM" body params
const crm = d.nodes.find(x => x.id === "create-lead");
if (crm) {
  crm.parameters.bodyParameters.parameters[0].value = botRef + 'remoteJid }}';
  crm.parameters.bodyParameters.parameters[1].value = '={{ "Lead qualificado via bot - " + ($items("Bot Conversacional")[0].json.dados ? ($items("Bot Conversacional")[0].json.dados.razaoSocial || "") : "") }}';
}

fs.writeFileSync("n8n/whatsapp-bot-atendimento.json", JSON.stringify(d, null, 2));
console.log("✓ All node references fixed");
