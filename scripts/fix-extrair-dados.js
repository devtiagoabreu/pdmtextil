const fs = require("fs");
const d = JSON.parse(fs.readFileSync("n8n/whatsapp-bot-atendimento.json", "utf8"));

// Fix "Extrair dados" function
const extract = d.nodes.find(x => x.id === "extract-data");
extract.parameters.functionCode = `const item = $input.first().json;
const body = item.body || item;
const data = body.data || {};
const key = data.key || {};

// remoteJid original (pode ser @lid, @s.whatsapp.net, @g.us)
const remoteJid = key.remoteJid || body.remoteJid || "";

// Pula se for mensagem enviada pela propria instancia
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

// Para Evolution API: se remoteJid for @lid, usa o proprio @lid
// Se for @s.whatsapp.net, extrai so o numero
const numero = remoteJid.includes("@s.whatsapp.net")
  ? remoteJid.replace("@s.whatsapp.net", "")
  : remoteJid; // mantem @lid ou outro formato

const pushName = data.pushName || body.pushName || "";

return [{
  json: { remoteJid, numero, mensagem, pushName }
}];`;

// Fix "Bot Conversacional" - remove $items() dependency, use conversa data directly
const bot = d.nodes.find(x => x.id === "bot-logic");
bot.parameters.functionCode = `// Conversa state vem do input, mensagem vem de $items("Extrair dados")
const conversa = $input.first().json;
const msgItems = $items("Extrair dados");
const msgData = (msgItems && msgItems.length > 0) ? msgItems[0].json : {};
// Se $items falhar, usa o proprio $input como fallback
const remoteJid = conversa.remoteJid || msgData.remoteJid || "";
const numero = msgData.numero || "";
const mensagem = msgData.mensagem || conversa.mensagem || "";
const pushName = msgData.pushName || "";
const estadoAtual = conversa.estado || "SAUDACAO";
const dados = conversa.dados || {};
const msgLower = mensagem.toLowerCase().trim();
const sim = ["sim", "s", "ss", "claro", "ok", "pode ser", "vamos", "bora", "yes"];
const nao = ["não", "nao", "n", "ñ", "nem", "no"];
let resposta = "";
let proximoEstado = estadoAtual;
let leadPronto = false;

switch (estadoAtual) {
  case "SAUDACAO":
    const nome = pushName ? ", " + pushName : "";
    resposta = "Ola" + nome + "! Bem-vindo(a) a PRO MODA Textil! Somos uma industria textil brasileira, especializada em tecidos para: Hospitalar, WorkWear, Decoracao, Colchoes e Forro de Bolso. Atendemos exclusivamente pessoas juridicas (empresas). Voce e pessoa juridica? (Sim/Nao)";
    proximoEstado = "VALIDANDO_PJ";
    break;
  case "VALIDANDO_PJ":
    var ehSim = sim.some(function(p) { return msgLower.startsWith(p) || msgLower.includes(" " + p) || msgLower === p; });
    var ehNao = nao.some(function(p) { return msgLower.startsWith(p) || msgLower === p; });
    if (ehNao || msgLower.includes("fisica")) {
      resposta = "Infelizmente atendemos apenas pessoas juridicas (empresas com CNPJ ativo). Se no futuro voce abrir um CNPJ, estaremos aqui para ajudar! Agradecemos o contato!";
      proximoEstado = "ENCERRADO";
    } else if (ehSim || msgLower.includes("juridica") || msgLower.includes("empresa") || msgLower.includes("cnpj") || msgLower.includes("sou")) {
      resposta = "Otimo! Para continuar, preciso de algumas informacoes: 1) Razao Social da empresa 2) CNPJ 3) Nome para contato. Fique a vontade para enviar os dados em uma unica mensagem ou separadamente.";
      proximoEstado = "COLETANDO_DADOS";
    } else {
      resposta = "Desculpe, nao entendi. Voce e pessoa juridica (empresa)? Responda Sim ou Nao.";
      proximoEstado = "VALIDANDO_PJ";
    }
    break;
  case "COLETANDO_DADOS":
    var cnpjRegex = /(\\d{2}[.]?\\d{3}[.]?\\d{3}[/]?\\d{4}[-]?\\d{2})/g;
    var cnpjMatch = mensagem.match(cnpjRegex);
    if (cnpjMatch) { dados.cnpj = cnpjMatch[0]; }
    if (mensagem.length > 5 && !dados.razaoSocial) {
      var linhas = mensagem.split("\\n").filter(function(l) { return l.trim(); });
      for (var i = 0; i < linhas.length; i++) {
        var l = linhas[i].trim();
        var c = l.match(cnpjRegex);
        if (c && !dados.cnpj) { dados.cnpj = c[0]; }
        else if (!dados.razaoSocial && l.length > 5 && !c) { dados.razaoSocial = l; }
      }
    }
    if (!dados.nomeContato && pushName) { dados.nomeContato = pushName; }
    if (dados.cnpj && dados.razaoSocial) {
      if (!dados.nomeContato) dados.nomeContato = pushName || "Nao informado";
      resposta = "Perfeito! Dados registrados: Empresa: " + dados.razaoSocial + ", CNPJ: " + dados.cnpj + ", Contato: " + dados.nomeContato + ". Voce ja conhece os produtos da PRO MODA Textil? (Sim/Nao)";
      proximoEstado = "PERGUNTANDO_PRODUTOS";
    } else {
      var pedindo = "Ainda preciso de algumas informacoes: ";
      if (!dados.razaoSocial) pedindo += "Razao Social da empresa; ";
      if (!dados.cnpj) pedindo += "CNPJ da empresa; ";
      if (!dados.nomeContato) pedindo += "Nome para contato; ";
      pedindo += "Pode enviar os dados que faltam?";
      resposta = pedindo;
      proximoEstado = "COLETANDO_DADOS";
    }
    break;
  case "PERGUNTANDO_PRODUTOS":
    var ehSim2 = sim.some(function(p) { return msgLower.startsWith(p) || msgLower.includes(" " + p) || msgLower === p; });
    if (ehSim2 || msgLower.includes("produto") || msgLower.includes("conheco")) {
      resposta = "Conheca nossas linhas: LINHA HOSPITALAR - Tecidos para lencais hospitalares. WORKWEAR - Uniformes profissionais. DECORACAO - Tecidos para enxoval. COLCHOES - Alta performance para setor colchoeiro. FORRO DE BOLSO - Tecidos resistentes. Qual linha te interessou?";
      proximoEstado = "MOSTRANDO_PRODUTOS";
    } else {
      resposta = "Nao entendi. Voce ja conhece nossos produtos? (Sim/Nao)";
      proximoEstado = "PERGUNTANDO_PRODUTOS";
    }
    break;
  case "MOSTRANDO_PRODUTOS":
    resposta = "Que bom! Um representante comercial entrara em contato com voce em ate 5 minutos pelo WhatsApp. Enquanto isso, conheca mais: www.promodatextil.com.br / contato@promodatextil.com.br / (19) 99832-2339. Agradecemos o contato!";
    proximoEstado = "AGUARDANDO_REPRESENTANTE";
    leadPronto = true;
    break;
  case "AGUARDANDO_REPRESENTANTE":
    resposta = "Ja registramos seu interesse! Um representante entrara em contato em breve.";
    break;
  case "ENCERRADO":
    resposta = "Conversa encerrada. Se precisar, e so chamar!";
    break;
  default:
    resposta = "Ola! Como posso ajudar?";
    proximoEstado = "SAUDACAO";
}

return [{
  json: {
    remoteJid,
    numero,
    mensagem: resposta,
    proximoEstado,
    dados,
    leadPronto
  }
}];`;

// Fix "Enviar resposta WhatsApp" - use $json.numero (do bot, que tem o remoteJid correto)
const send = d.nodes.find(x => x.id === "send-response");
send.parameters.sendHeaders = true;
send.parameters.headerParameters = {
  parameters: [
    { name: "apikey", value: "E7CFC0D4875D-46F3-BF90-3946AAD1917A" }
  ]
};
delete send.parameters.options.headers;
// Usar $json (input do node anterior = "Salvar estado") - mas numero nao passa pelo POST
// Entao usa $items("Bot Conversacional")
send.parameters.bodyParameters.parameters[0].value = '={{ $items("Bot Conversacional")[0].json.numero }}';
send.parameters.bodyParameters.parameters[1].value = '={{ $items("Bot Conversacional")[0].json.mensagem }}';

// Fix "Criar Lead CRM" - usar $items("Bot Conversacional")
const crm = d.nodes.find(x => x.id === "create-lead");
crm.parameters.bodyParameters.parameters[0].value = '={{ $items("Bot Conversacional")[0].json.remoteJid }}';
crm.parameters.bodyParameters.parameters[1].value = '={{ "Lead qualificado via bot - " + ($items("Bot Conversacional")[0].json.dados ? ($items("Bot Conversacional")[0].json.dados.razaoSocial || "") : "") }}';

// Fix "Lead pronto?" filter - usar $items("Bot Conversacional")
const filter = d.nodes.find(x => x.id === "filter-lead");
filter.parameters.conditions.boolean[0].value1 = '={{ $items("Bot Conversacional")[0].json.leadPronto }}';

fs.writeFileSync("n8n/whatsapp-bot-atendimento.json", JSON.stringify(d, null, 2));
console.log("✓ All fixes applied");
