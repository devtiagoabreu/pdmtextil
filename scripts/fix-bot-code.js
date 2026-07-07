const fs = require("fs");

const data = JSON.parse(fs.readFileSync("n8n/whatsapp-bot-atendimento.json", "utf8"));
const node = data.nodes.find(n => n.id === "bot-logic");

const code = `
// Merge: get conversation state from current input, message data from Extrair dados
const conversa = $input.first().json;
const msgItems = $items("Extrair dados");
const msgData = (msgItems && msgItems.length > 0) ? msgItems[0].json : {};
const remoteJid = conversa.remoteJid || msgData.remoteJid || "";
const numero = msgData.numero || "";
const mensagem = msgData.mensagem || "";
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
    var ehSim = sim.some(p => msgLower.startsWith(p) || msgLower.includes(" " + p) || msgLower === p);
    var ehNao = nao.some(p => msgLower.startsWith(p) || msgLower === p);
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
      var linhas = mensagem.split("\\n").filter(l => l.trim());
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
    var ehSim2 = sim.some(p => msgLower.startsWith(p) || msgLower.includes(" " + p) || msgLower === p);
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

node.parameters.functionCode = code;
fs.writeFileSync("n8n/whatsapp-bot-atendimento.json", JSON.stringify(data, null, 2));
console.log("✓ Function code rewritten successfully");
