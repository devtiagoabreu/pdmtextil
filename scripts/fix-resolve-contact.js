const fs = require("fs");
const d = JSON.parse(fs.readFileSync("n8n/whatsapp-bot-atendimento.json", "utf8"));

// Update "Extrair numero" function to handle different response formats
const ex = d.nodes.find(x => x.id === "extract-number");
ex.parameters.functionCode = `const input = $input.first().json;
// fetchContacts pode retornar array direto ou objeto com campo contacts
const contacts = Array.isArray(input) ? input : (input.contacts || input.response || []);
if (!Array.isArray(contacts)) {
  return [{ json: { numeroReal: "", contactsCount: 0, error: "formato inesperado" } }];
}

const msgData = $items("Extrair dados");
const pushName = (msgData && msgData.length > 0) ? (msgData[0].json.pushName || "") : "";
const lidJid = (msgData && msgData.length > 0) ? (msgData[0].json.remoteJid || "") : "";

var found = null;
// 1. Tenta match pelo JID (id do contato pode ser o @lid)
for (var i = 0; i < contacts.length; i++) {
  var c = contacts[i];
  if (c.id === lidJid || c.id === lidJid.replace("@lid", "") + "@s.whatsapp.net") {
    found = c; break;
  }
}
// 2. Fallback: match pelo pushName
if (!found && pushName) {
  for (var i = 0; i < contacts.length; i++) {
    var c = contacts[i];
    if (c.name && c.name.toLowerCase() === pushName.toLowerCase()) { found = c; break; }
  }
}

var numeroReal = "";
if (found) {
  numeroReal = (found.number || "").replace("@s.whatsapp.net", "");
}

return [{ json: { numeroReal, contactsCount: contacts.length, pushName, lidJid } }];`;

// Update "Enviar resposta WhatsApp" body number with fallback
const send = d.nodes.find(x => x.id === "send-response");
send.parameters.bodyParameters.parameters[0].value = '={{ $json.numeroReal || $items("Bot Conversacional")[0].json.numero }}';

fs.writeFileSync("n8n/whatsapp-bot-atendimento.json", JSON.stringify(d, null, 2));
console.log("✓ Contact resolution fixed");
