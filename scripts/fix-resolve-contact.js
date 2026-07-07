const fs = require("fs");
const d = JSON.parse(fs.readFileSync("n8n/whatsapp-bot-atendimento.json", "utf8"));

// Volta para fetchContacts (mais confiável que fetchChats)
const fc = d.nodes.find(x => x.id === "fetch-contacts");
fc.parameters.url = "https://evolutionapi.tiagoabreu.dev/contact/fetchContacts/maketing_pdm_pro_moda";

// Extrair numero function - procura contato por JID ou nome
const ex = d.nodes.find(x => x.id === "extract-number");
ex.parameters.functionCode = `const input = $input.first().json;
const contacts = Array.isArray(input) ? input : (input.contacts || input.response || []);
if (!Array.isArray(contacts)) {
  return [{ json: { numeroReal: "", resolved: false, contactsCount: 0 } }];
}

const msgData = $items("Extrair dados");
const lidJid = (msgData && msgData.length > 0) ? (msgData[0].json.remoteJid || "") : "";
const pushName = (msgData && msgData.length > 0) ? (msgData[0].json.pushName || "") : "";

var found = null;
// 1. Match pelo JID exato (contacts.id pode ser @lid ou numero@s.whatsapp.net)
for (var i = 0; i < contacts.length; i++) {
  var c = contacts[i];
  if (c.id === lidJid || c.jid === lidJid) { found = c; break; }
}
// 2. Fallback: match pelo nome
if (!found && pushName) {
  var pn = pushName.toLowerCase();
  for (var i = 0; i < contacts.length; i++) {
    var c = contacts[i];
    var cn = (c.name || c.notify || c.pushName || "").toLowerCase();
    if (cn === pn || cn.includes(pn)) { found = c; break; }
  }
}

var numeroReal = "";
if (found) {
  numeroReal = (found.number || "").replace("@s.whatsapp.net", "");
  if (!numeroReal) numeroReal = (found.id || "").replace("@s.whatsapp.net", "");
}

return [{ json: { numeroReal, resolved: !!found, contactsCount: contacts.length, pushName, lidJid } }];`;

// Enviar resposta WhatsApp usa numeroReal com fallback para @lid
const send = d.nodes.find(x => x.id === "send-response");
send.parameters.bodyParameters.parameters[0].value = '={{ $json.numeroReal || $items("Bot Conversacional")[0].json.numero }}';

fs.writeFileSync("n8n/whatsapp-bot-atendimento.json", JSON.stringify(d, null, 2));
console.log("✓ fetchContacts approach ready");
