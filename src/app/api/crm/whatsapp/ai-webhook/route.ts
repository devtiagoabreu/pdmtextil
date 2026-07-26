import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmNotificacoes } from "@/lib/db/schema/crm-notificacoes"
import { crmWhatsappFlowLogs } from "@/lib/db/schema/crm-whatsapp-flow-logs"
import { crmWhatsAppCatalogos } from "@/lib/db/schema/crm-whatsapp-catalogos"
import { crmWhatsAppLinhas } from "@/lib/db/schema/crm-whatsapp-linhas"
import { eq, sql, desc, and } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const REPRESENTANTE_PJ = process.env.WHATSAPP_REPRESENTANTE_PJ || "5519999999999"
const REPRESENTANTE_PF = process.env.WHATSAPP_REPRESENTANTE_PF || "5519999999998"

function buildSystemPrompt(linhas: { numero: number; nome: string }[]): string {
  const listaLinhas = linhas.map(l => `${l.numero} - ${l.nome}`).join("\n")
  return `Voce e o assistente de vendas virtual da Pro Moda Textil, uma industria textil brasileira especializada em tecidos planos, hospitalares e industriais.

FLUXO DA CONVERSA:
Estado SAUDACAO: Apresente-se e pergunte "Qual o seu nome?".
Estado COLETANDO_NOME: Extraia apenas o nome proprio do usuario (ex: se ele disser "Meu nome e Tiago", registre apenas "Tiago"). Confirme: "Prazer em te conhecer, [NOME]!".
Estado COLETANDO_DOC: Pergunte "Voce e pessoa fisica ou juridica? Digite:
1 - Pessoa Fisica (PF)
2 - Pessoa Juridica (PJ)"
Depois, informe o seu CPF ou CNPJ.
Estado COLETANDO_INTERESSE: Informe que todas as linhas sao de tecidos planos e pergunte em qual linha ele tem interesse. O cliente pode escolher UMA ou MAIS linhas separadas por virgula. Use lista numerada:
"Todas as nossas linhas sao de tecidos planos. Qual delas te interessa? Voce pode escolher mais de uma, separando por virgula (ex: 1,3).
${listaLinhas}"
Quando o cliente responder, confirme as linhas escolhidas: "Otimo! Voce tem interesse nas linhas: [LINHAS]. Vou enviar os links do catalogo para voce conferir!".
Estado CONFIRMACAO: Mostre o resumo dos dados (nome, documento, tipo pessoa) e da(s) linha(s) de interesse. Pergunte "Esta correto? Digite SIM para confirmar."
Estado ENCERRADO: Informe que os links do catalogo foram enviados acima e que um representante comercial entrara em contato em ate 10 min. Agradeca.

IMPORTANTE: Apos a CONFIRMACAO com SIM, o sistema automaticamente envia os links do catalogo das linhas escolhidas. Voce so precisa informar "Aqui estao os catalogos das linhas que voce escolheu!" e os links serao enviados em seguida.

CONTEXTO:
- Cliente: {{pushName}}
- Estado: {{estado}}
- Dados: {{dados}}

REGRAS DE VALIDACAO POR ESTADO (OBRIGATORIO SEGUIR):

ESTADO COLETANDO_NOME - O que ACEITAR:
- Apenas um nome proprio ou nome completo (ex: "Tiago", "Maria Silva", "Joao de Sousa")
- Respostas como "Meu nome e Tiago", "Pode me chamar de Maria", "Sou o Joao"

ESTADO COLETANDO_NOME - O que REJEITAR (NAO registre como nome, peca para repetir):
- Numeros ou frases com numeros ("Tenho 20 anos", "25", "123")
- Palavras soltas que nao sao nomes ("Tenho", "Ola", "Bom dia", "Ok", "Sim", "Nao")
- Respostas do tipo "nao sei", "nao quero informar", "deixa pra la"
- Frases inteiras que claramente nao sao nomes ("Quero comprar tecido", "Qual o preco")
- Documentos (CPF, CNPJ) enviados no estado de nome
Se o que o usuario enviou nao e claramente um nome proprio, responda: "Preciso do seu nome para continuar. Por favor, informe seu nome proprio."

ESTADO COLETANDO_DOC - O que ACEITAR:
- Opcao 1 ou 2 (ou PF/PJ/fisica/juridica)
- CPF ou CNPJ (com ou sem formatacao)
- Pode vir junto: "PF 123.456.789-00" ou "2 PJ 12.345.678/0001-90"

ESTADO COLETANDO_DOC - O que REJEITAR:
- Nommes, palavras aleatorias, emojis, perguntas sobre preco/produto
- Respostas que nao contenham numero 1 ou 2, PF/PJ, ou documento
Se o usuario nao entender, explique: "Por favor, digite 1 para Pessoa Fisica ou 2 para Pessoa Juridica, e em seguida seu CPF ou CNPJ."

ESTADO COLETANDO_INTERESSE - O que ACEITAR:
- Numeros das linhas listadas, separados por virgula (ex: "1", "1,3", "2 e 4")
- Nomes das linhas (ex: "Linha Lencol", "Hospitalar")

ESTADO COLETANDO_INTERESSE - O que REJEITAR:
- Respostas que nao contenham nenhum numero ou nome de linha
- "Nao sei", "nenhuma", "todos", sem especificar
Se o usuario nao escolher, responda: "Por favor, escolha pelo menos uma linha digitando o numero correspondente. As opcoes sao: [lista]."

ESTADO CONFIRMACAO - O que ACEITAR:
- SIM, S, OK, CORRETO, CERTO, CONFIRMO, CLARO para confirmar
- NAO, N, ERRADO, INCORRETO, ALTERAR para alterar (volta para o estado anterior)

REGRAS GERAIS:
- Use portugues brasileiro natural, cordial e profissional.
- Maximo 3 linhas por mensagem.
- Faca apenas UMA pergunta de cada vez.
- Extraia o nome proprio ignorando preambulos como "Meu nome e", "Pode me chamar de" ou "Eu sou".
- Use listas numeradas e quebras de linha para opcoes multiplas.
- Deixe claro que todas as linhas sao de tecidos planos.
- Para PF colete: nome, CPF, tipoPessoa=PF.
- Para PJ colete: nome, CNPJ, tipoPessoa=PJ.
- No estado COLETANDO_INTERESSE, aceite multiplas opcoes separadas por virgula (ex: "1,2,4").

REGRAS OBRIGATORIAS - O QUE VOCE NAO PODE FAZER:
- NAO use emojis em hipotese alguma.
- NAO invente informacoes sobre produtos, precos ou prazos.
- NAO responda sobre assuntos fora do escopo de vendas e atendimento.
- NAO compartilhe dados de outros clientes.
- NAO faca promessas de entrega ou estoque.
- NAO use linguagem tecnica ou formal demais.
- NAO envie mais de uma mensagem por vez.
- NAO repita a pergunta ja feita.
- NAO mude de assunto antes de completar o fluxo atual.`
}

interface EvolutionWebhookBody {
  data?: {
    key?: {
      remoteJid?: string
      fromMe?: boolean
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: { text?: string }
      imageMessage?: { caption?: string }
      documentMessage?: { caption?: string }
      videoMessage?: { caption?: string }
    }
    messageType?: string
  }
  sender?: string
  pushName?: string
  remoteJid?: string
}

function extrairMensagem(body: EvolutionWebhookBody): string {
  const msg = body.data?.message
  if (!msg) return ""
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.videoMessage?.caption ||
    ""
  )
}

function extrairNumero(remoteJid: string): string {
  return remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/@lid$/, "").replace(/\D/g, "")
}

function extrairDoc(texto: string): { doc: string; tipo: string } | null {
  const cnpj = texto.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
  if (cnpj) return { doc: cnpj[0], tipo: "PJ" }
  const cpf = texto.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/)
  if (cpf) return { doc: cpf[0], tipo: "PF" }
  return null
}

function detectarTipo(texto: string): string | null {
  if (/\b(1|pf|fisica|física)\b/.test(texto)) return "PF"
  if (/\b(2|pj|juridica|jurídica|cnpj)\b/.test(texto)) return "PJ"
  return null
}

function pareceNome(texto: string): boolean {
  const alpha = texto.replace(/[^a-zA-ZÀ-ÿ ]/g, "").trim()
  return alpha.length > 2
}

function confirmou(texto: string): boolean {
  return /\b(sim|s|ss|claro|ok|confirmo|correto|certo)\b/.test(texto)
}

function parseLinhas(texto: string, maxNumero: number): number[] {
  const nums = texto.match(/\d/g)
  if (!nums) return []
  return [...new Set(nums.map(Number))].filter((n) => n >= 1 && n <= maxNumero).sort()
}

function linhasNomes(nums: number[], linhaMap: Record<number, string>): string {
  return nums.map((n) => `${n} - ${linhaMap[n]}`).join(", ")
}

interface MaquinaEstadoResult {
  nextEstado: string
  dados: Record<string, any>
  resposta?: string
  finalizado: boolean
  enviarCatalogo?: number[]
}

function maquinaEstados(
  curEstado: string,
  curDados: Record<string, any>,
  msgOriginal: string,
  aiResponse: string,
  linhaMap: Record<number, string>,
  maxNumero: number
): MaquinaEstadoResult {
  const msg = msgOriginal.toLowerCase().trim()
  let nextEstado = curEstado
  const dados = JSON.parse(JSON.stringify(curDados))
  let enviarCatalogo: number[] | undefined

  dados._tentativas = (dados._tentativas || 0) + 1
  const MAX_TENTATIVAS = 3

  if (curEstado === "SAUDACAO") {
    nextEstado = "COLETANDO_NOME"
  } else if (curEstado === "COLETANDO_NOME") {
    const rejeitado = rejeitarNome(msgOriginal)
    if (!rejeitado && msgOriginal.length > 2 && pareceNome(msgOriginal)) {
      dados.nome = msgOriginal
      nextEstado = "COLETANDO_DOC"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "nome_invalido_repetido"
    }
  } else if (curEstado === "COLETANDO_DOC") {
    const tipo = detectarTipo(msg) || (extrairDoc(msgOriginal) ? extrairDoc(msgOriginal)!.tipo : null)
    const doc = extrairDoc(msgOriginal)
    if (tipo) dados.tipoPessoa = tipo
    if (doc) dados.documento = doc.doc
    if (!dados.tipoPessoa && doc) dados.tipoPessoa = doc.tipo
    if (!dados.nome && pareceNome(msgOriginal) && msgOriginal.length < 50) {
      dados.nome = msgOriginal
    }
    if (dados.documento || dados.tipoPessoa) {
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "doc_invalido_repetido"
    }
  } else if (curEstado === "COLETANDO_INTERESSE") {
    const linhas = parseLinhas(msgOriginal, maxNumero)
    const temNomeLinha = linhas.map(n => linhaMap[n]?.toLowerCase() || "").some(nome => msg.includes(nome))
    if (linhas.length > 0 || temNomeLinha) {
      dados.linhasInteresse = linhas
      dados.linhasInteresseNomes = linhasNomes(linhas, linhaMap)
      nextEstado = "CONFIRMACAO"
      dados._tentativas = 0
    } else if (msg.match(/\b(todos|todas|tudo|qualquer|tanto faz|indiferente|foda-se|se foda)\b/)) {
      dados.linhasInteresse = Object.keys(linhaMap).map(Number)
      dados.linhasInteresseNomes = linhasNomes(dados.linhasInteresse, linhaMap)
      nextEstado = "CONFIRMACAO"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "interesse_invalido_repetido"
    }
  } else if (curEstado === "CONFIRMACAO") {
    if (confirmou(msg)) {
      nextEstado = "ENCERRADO"
      dados.finalizado = true
      enviarCatalogo = dados.linhasInteresse || []
      dados._tentativas = 0
    } else if (negou(msg)) {
      nextEstado = "COLETANDO_NOME"
      dados.nome = undefined
      dados.documento = undefined
      dados.tipoPessoa = undefined
      dados.linhasInteresse = undefined
      dados.linhasInteresseNomes = undefined
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "confirmacao_invalida_repetido"
    }
  } else if (curEstado === "ENCERRADO") {
    dados.finalizado = true
  }

  return { nextEstado, dados, finalizado: !!dados.finalizado, enviarCatalogo }
}

function rejeitarNome(texto: string): string | null {
  const t = texto.toLowerCase().trim()
  if (/^\d+$/.test(t)) return "numero_puro"
  if (/\d/.test(t) && /\b(ano|mes|dia|hora|idade|ano|tel|cel|whatsapp)\b/.test(t)) return "idade_ou_info_pessoal"
  if (/^(tenho|possuo|sou|meu|minha|meu nome|meu nome e|minha nome)\b/.test(t) && t.split(" ").length <= 3) return "frase_incompleta"
  if (/^(nao sei|não sei|nao quero|não quero|deixa pra la|deixa pra la|se foda|foda-se|tanto faz|indiferente|whatever|ok|sim|nao|não|s|n)\b/.test(t)) return "resposta_evaziva"
  if (/^(cpf|cnpj|documento|doc|registro)\b/.test(t)) return "documento_no_nome"
  if (/^(preco|preço|valor|quanto|custa|frete)\b/.test(t)) return "pergunta_fora_do_fluxo"
  if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|hello|hi|hey)\b/.test(t) && t.split(" ").length <= 3) return "saudacao_sem_nome"
  return null
}

function negou(texto: string): boolean {
  return /\b(nao|não|errado|incorreto|alterar|corrigir|voltar|diferente|trocar|mudar)\b/.test(texto)
}

async function chamarGroq(
  userMessage: string,
  pushName: string,
  estado: string,
  dados: Record<string, any>,
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  linhas: { numero: number; nome: string }[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === "cole-sua-chave-groq-aqui") {
    console.error("[Groq] GROQ_API_KEY não configurada")
    return "Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em instantes."
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

  const systemMessage = buildSystemPrompt(linhas).replace("{{pushName}}", pushName)
    .replace("{{estado}}", estado)
    .replace("{{dados}}", JSON.stringify(dados))

  const messages = [
    { role: "system" as const, content: systemMessage },
    ...historico.slice(-15),
    { role: "user" as const, content: userMessage },
  ]

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[Groq] Erro ${res.status}:`, err)
    return "Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em instantes."
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || "Desculpe, nao consegui processar sua mensagem."
}

async function logStep(
  executionId: string,
  remoteJid: string,
  pushName: string,
  step: string,
  status: string,
  input: Record<string, any>,
  output: Record<string, any>,
  error: string | null,
  durationMs: number
) {
  try {
    await db.insert(crmWhatsappFlowLogs).values({
      executionId,
      remoteJid,
      pushName,
      step,
      status,
      input,
      output,
      error,
      durationMs,
    })
  } catch (e) {
    console.error("[FlowLog] Falha ao salvar log:", e)
  }
}

export async function POST(req: NextRequest) {
  let executionId = "no-exec"
  let remoteJidGlobal = ""
  let pushNameGlobal = ""
  try { executionId = crypto.randomUUID() } catch { executionId = `fallback-${Date.now()}` }

  try {
    const webhookSecret = process.env.PDM_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("[AI-Webhook] PDM_WEBHOOK_SECRET não configurado")
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 })
    }

    const authHeader = req.headers.get("authorization")
    const querySecret = req.nextUrl.searchParams.get("secret")
    const authValid = authHeader === `Bearer ${webhookSecret}` || querySecret === webhookSecret

    await logStep(executionId, remoteJidGlobal, pushNameGlobal, "auth", authValid ? "success" : "error", {
      method: authHeader ? "bearer" : "query",
      querySecretLen: querySecret?.length || 0,
      querySecretLast4: querySecret?.slice(-4) || "",
      envSecretLen: webhookSecret.length,
      envSecretLast4: webhookSecret.slice(-4),
      fullUrl: req.nextUrl.pathname + "?" + req.nextUrl.searchParams.toString(),
    }, { valid: authValid }, authValid ? null : "Unauthorized", 0)

    if (!authValid) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const rawText = await req.text()
    let body: EvolutionWebhookBody
    try {
      body = JSON.parse(rawText)
    } catch {
      try {
        const decoded = Buffer.from(rawText, "base64").toString("utf-8")
        body = JSON.parse(decoded)
      } catch {
        await logStep(executionId, remoteJidGlobal, pushNameGlobal, "extract", "error", { rawTextLen: rawText.length, rawPreview: rawText.substring(0, 100) }, {}, "Failed to parse body (JSON or base64)", 0)
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
      }
    }

    const pushName = body.data?.pushName || body.pushName || ""
    const remoteJid = body.data?.key?.remoteJid || body.remoteJid || body.sender || ""
    const fromMe = body.data?.key?.fromMe === true
    const mensagem = extrairMensagem(body)

    await logStep(executionId, remoteJid, pushName, "extract", "success", { rawBody: { remoteJid, pushName, fromMe } }, { remoteJid, pushName, fromMe, mensagem: mensagem.substring(0, 100), msgType: body.data?.messageType }, null, 0)

    if (fromMe) {
      await logStep(executionId, remoteJid, pushName, "filter", "ignored", { fromMe, mensagem }, { reason: "fromMe" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "fromMe" })
    }
    if (!mensagem || !mensagem.trim()) {
      await logStep(executionId, remoteJid, pushName, "filter", "ignored", { mensagem }, { reason: "empty" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "empty" })
    }
    if (!remoteJid) {
      await logStep(executionId, remoteJid, pushName, "filter", "ignored", { remoteJid }, { reason: "no_sender" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "no_sender" })
    }

    await logStep(executionId, remoteJid, pushName, "filter", "success", { fromMe, mensagem: mensagem.substring(0, 100) }, { reason: "passed" }, null, 0)

    const t0 = Date.now()
    let conversa = await db
      .select()
      .from(crmWhatsappConversas)
      .where(eq(crmWhatsappConversas.remoteJid, remoteJid))
      .limit(1)
      .then((r) => r[0] || null)

    let isNew = false
    let leadExistenteData = null

    if (!conversa) {
      isNew = true
      const numero = extrairNumero(remoteJid)
      leadExistenteData = await db
        .select({
          id: crmLeads.id,
          nome: crmLeads.nome,
          empresaNome: crmLeads.empresaNome,
          tipoPessoa: crmLeads.tipoPessoa,
        })
        .from(crmLeads)
        .where(
          sql`(${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numero)}) AND ${crmLeads.status} != 'CONVERTIDO'`
        )
        .limit(1)
        .then((r) => r[0] || null)

      const dadosIniciais: Record<string, any> = {}
      let estadoInicial = "SAUDACAO"

      if (leadExistenteData) {
        if (leadExistenteData.empresaNome) dadosIniciais.razaoSocial = leadExistenteData.empresaNome
        if (leadExistenteData.nome) dadosIniciais.nomeContato = leadExistenteData.nome
        if (leadExistenteData.tipoPessoa) dadosIniciais.tipoPessoa = leadExistenteData.tipoPessoa
        estadoInicial = leadExistenteData.empresaNome ? "AGUARDANDO_REPRESENTANTE" : "COLETANDO_DADOS"
      }

      const [nova] = await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: estadoInicial, dados: dadosIniciais })
        .returning()
      conversa = nova
    }

    const findConvDuration = Date.now() - t0
    await logStep(executionId, remoteJid, pushName, "find_conversation", "success", { remoteJid, isNew, leadExists: !!leadExistenteData }, { estado: conversa.estado, conversaId: conversa.id, dados: conversa.dados }, null, findConvDuration)

    const linhasAtivas = await db
      .select()
      .from(crmWhatsAppLinhas)
      .where(eq(crmWhatsAppLinhas.ativo, true))
      .orderBy(crmWhatsAppLinhas.numero)

    const linhaMap: Record<number, string> = {}
    for (const l of linhasAtivas) {
      linhaMap[l.numero] = l.nome
    }
    const maxNumero = linhasAtivas.length > 0 ? linhasAtivas[linhasAtivas.length - 1].numero : 5

    if (conversa.estado === "AGUARDANDO_REPRESENTANTE" || conversa.estado === "ENCERRADO") {
      await logStep(executionId, remoteJid, pushName, "state_machine", "ignored", { estado: conversa.estado }, { reason: "conversation_ended" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "conversation_ended", estado: conversa.estado })
    }

    const historicoRows = await db
      .select({ mensagem: crmWhatsappMensagens.mensagem, tipo: crmWhatsappMensagens.tipo })
      .from(crmWhatsappMensagens)
      .where(eq(crmWhatsappMensagens.remoteJid, remoteJid))
      .orderBy(desc(crmWhatsappMensagens.createdAt))
      .limit(30)
      .then((r) => r.reverse())

    const historico: Array<{ role: "user" | "assistant"; content: string }> = historicoRows.map((row) => ({
      role: row.tipo === "RECEBIDA" ? "user" : "assistant",
      content: row.mensagem,
    }))

    const tGroq = Date.now()
    const aiResponse = await chamarGroq(mensagem, pushName, conversa.estado, conversa.dados || {}, historico, linhasAtivas)
    const groqDuration = Date.now() - tGroq

    const groqError = aiResponse.includes("dificuldades tecnicas") || aiResponse.includes("nao consegui processar")
    await logStep(executionId, remoteJid, pushName, "groq_call", groqError ? "error" : "success", { model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile", estado: conversa.estado, historicoSize: historico.length, userMessage: mensagem.substring(0, 100) }, { response: aiResponse.substring(0, 200) }, groqError ? "Groq returned error message" : null, groqDuration)

    const tState = Date.now()
    const { nextEstado, dados, finalizado, enviarCatalogo } = maquinaEstados(conversa.estado, conversa.dados || {}, mensagem, aiResponse, linhaMap, maxNumero)
    const stateDuration = Date.now() - tState

    await logStep(executionId, remoteJid, pushName, "state_machine", "success", { curEstado: conversa.estado, msg: mensagem.substring(0, 100) }, { nextEstado, dados, finalizado, enviarCatalogo }, null, stateDuration)

    if (dados._bloqueado) {
      const motivo = dados._motivoBloqueio || "respostas_invalidas"
      const representante = dados.tipoPessoa === "PJ" ? REPRESENTANTE_PJ : REPRESENTANTE_PF
      const bloqueioMsg = "Parece que nao estou conseguindo entender suas respostas. Vou te conectar com um representante comercial que podera ajudar voce melhor!"
      const contatoMsg = `Voce tambem pode entrar em contato diretamente: https://wa.me/${representante}`

      await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
      await db.insert(crmWhatsappMensagens).values({ mensagem: bloqueioMsg, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "AGUARDANDO_REPRESENTANTE", dados })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
        })

      if (evolutionConfigurado()) {
        await enviarMensagem(remoteJid, bloqueioMsg)
        await enviarMensagem(remoteJid, contatoMsg)
      }

      const repData = { remoteJid, motivo, estado: "AGUARDANDO_REPRESENTANTE" }
      try {
        await db.insert(crmNotificacoes).values({
          tipo: "WHATSAPP_BLOQUEADO",
          titulo: "Cliente bloqueado pelo bot",
          mensagem: `Cliente ${pushName} (${remoteJid}) deu respostas invalidas 3x seguidas. Motivo: ${motivo}. Redirecionado para representante.`,
          dados: repData,
          lida: false,
        })
      } catch (notifErr) {
        console.error("[AI-Webhook] Erro ao criar notificacao de bloqueio:", notifErr)
      }

      await logStep(executionId, remoteJid, pushName, "blocked_transfer", "success", { motivo, representante }, { estadoFinal: "AGUARDANDO_REPRESENTANTE" }, null, 0)

      return NextResponse.json({ ok: true, blocked: true })
    }

    const tSave = Date.now()
    await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
    await db.insert(crmWhatsappMensagens).values({ mensagem: aiResponse, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
    await db
      .insert(crmWhatsappConversas)
      .values({ remoteJid, estado: nextEstado, dados })
      .onConflictDoUpdate({
        target: crmWhatsappConversas.remoteJid,
        set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
      })
    const saveDuration = Date.now() - tSave

    await logStep(executionId, remoteJid, pushName, "save_messages", "success", { remoteJid, nextEstado }, { msgsSaved: 2, conversationUpdated: true }, null, saveDuration)

    let envioOk = true
    if (evolutionConfigurado()) {
      const tSend = Date.now()
      const envio = await enviarMensagem(remoteJid, aiResponse)
      const sendDuration = Date.now() - tSend
      envioOk = envio.sucesso
      await logStep(executionId, remoteJid, pushName, "send_response", envio.sucesso ? "success" : "error", { remoteJid, msgLength: aiResponse.length }, { sucesso: envio.sucesso, externalId: envio.externalId }, envio.erro || null, sendDuration)
      if (!envio.sucesso) {
        console.error("[AI-Webhook] Falha ao enviar:", envio.erro)
      }
    } else {
      await logStep(executionId, remoteJid, pushName, "send_response", "skipped", { remoteJid }, { reason: "evolution_not_configured" }, null, 0)
    }

    let leadCriado = null

    if (enviarCatalogo && enviarCatalogo.length > 0 && evolutionConfigurado()) {
      const tCat = Date.now()
      try {
        const tipoPessoa = dados.tipoPessoa || null
        const conditions = [
          eq(crmWhatsAppCatalogos.ativo, true),
          sql`${crmWhatsAppCatalogos.linhaNumero} IN ${enviarCatalogo}`,
        ]
        if (tipoPessoa) {
          conditions.push(sql`${crmWhatsAppCatalogos.tipoPessoa} IN (${tipoPessoa}, 'AMBOS')`)
        }

        const catalogos = await db
          .select()
          .from(crmWhatsAppCatalogos)
          .where(and(...conditions))
          .orderBy(crmWhatsAppCatalogos.linhaNumero, crmWhatsAppCatalogos.titulo)

        if (catalogos.length > 0) {
          const linhasAgrupadas: Record<number, typeof catalogos> = {}
          for (const cat of catalogos) {
            if (!linhasAgrupadas[cat.linhaNumero]) linhasAgrupadas[cat.linhaNumero] = []
            linhasAgrupadas[cat.linhaNumero].push(cat)
          }

          for (const [linhaNum, cats] of Object.entries(linhasAgrupadas)) {
            const linhaNome = cats[0]?.linhaNome || linhaMap[Number(linhaNum)] || `Linha ${linhaNum}`
            const linhas = [
              `*Catalogo - ${linhaNome}*`,
              "",
              ...cats.map((c) => `*${c.titulo}*\n${c.descricao || ""}\n${c.linkUrl}`),
            ].join("\n")
            await enviarMensagem(remoteJid, linhas)
          }

          const linhasSemCatalogo = enviarCatalogo.filter(n => !linhasAgrupadas[n])
          if (linhasSemCatalogo.length > 0) {
            const nomesSemCatalogo = linhasSemCatalogo.map(n => linhaMap[n] || `Linha ${n}`).join(", ")
            await enviarMensagem(remoteJid, `As seguintes linhas ainda nao possuem catalogo disponivel: ${nomesSemCatalogo}. Um representante comercial entrara em contato com mais informacoes.`)
          }

          await logStep(executionId, remoteJid, pushName, "send_catalog", "success", { linhas: enviarCatalogo, totalCatalogos: catalogos.length, linhasSemCatalogo }, { catalogosEnviados: true }, null, Date.now() - tCat)
        } else {
          await enviarMensagem(remoteJid, "No momento nao temos catalogos disponiveis para as linhas selecionadas. Um representante comercial entrara em contato com mais informacoes.")
          await logStep(executionId, remoteJid, pushName, "send_catalog", "empty", { linhas: enviarCatalogo }, { catalogosEnviados: false, reason: "no_active_catalogs" }, null, Date.now() - tCat)
        }
      } catch (catErr) {
        console.error("[AI-Webhook] Erro ao enviar catalogos:", catErr)
        await logStep(executionId, remoteJid, pushName, "send_catalog", "error", { linhas: enviarCatalogo }, {}, catErr instanceof Error ? catErr.message : "Unknown error", Date.now() - tCat)
      }
    }

    if (finalizado && dados.nome) {
      const existing = await db
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`))
        .limit(1)
        .then((r) => r[0] || null)

      if (!existing) {
        const tLead = Date.now()
        const numero = extrairNumero(remoteJid)
        const descricaoParts: string[] = []
        if (dados.documento) descricaoParts.push(`Documento: ${dados.documento}`)
        if (dados.tipoPessoa) descricaoParts.push(`Tipo: ${dados.tipoPessoa}`)
        if (dados.linhasInteresseNomes) descricaoParts.push(`Interesse: ${dados.linhasInteresseNomes}`)
        descricaoParts.push("Lead finalizado via WhatsApp")

        const [novo] = await db
          .insert(crmLeads)
          .values({
            nome: dados.nome,
            celular: numero,
            documento: dados.documento || null,
            tipoPessoa: dados.tipoPessoa || null,
            origem: "WHATSAPP",
            descricao: descricaoParts.join(" | "),
            idIntegracao: `whatsapp:${remoteJid}`,
          })
          .returning()

        leadCriado = novo
        const leadDuration = Date.now() - tLead
        await logStep(executionId, remoteJid, pushName, "create_lead", "success", { nome: dados.nome, numero, tipoPessoa: dados.tipoPessoa, documento: dados.documento }, { leadId: novo.id, idIntegracao: `whatsapp:${remoteJid}` }, null, leadDuration)

        const tNotif = Date.now()
        const numeroNotificacao = dados.tipoPessoa === "PJ" ? REPRESENTANTE_PJ : REPRESENTANTE_PF
        const textoNotificacao = [
          "*Novo lead cadastrado no CRM*",
          "",
          `Nome: ${dados.nome}`,
          `Telefone: ${numero}`,
          `Tipo: ${dados.tipoPessoa === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"}`,
          `Documento: ${dados.documento || "Nao informado"}`,
          dados.linhasInteresseNomes ? `Interesse: ${dados.linhasInteresseNomes}` : "",
          "",
          "Dados capturados pelo atendente automatico.",
        ].join("\n")

        await db.insert(crmNotificacoes).values({
          titulo: "Novo lead cadastrado via WhatsApp",
          mensagem: textoNotificacao,
          tipo: "lead_novo",
          link: "/comercial/crm/leads",
          metadados: { leadId: novo.id, remoteJid, pushName },
        })

        if (evolutionConfigurado()) {
          await enviarMensagem(`${numeroNotificacao}@s.whatsapp.net`, textoNotificacao)
        }
        const notifDuration = Date.now() - tNotif
        await logStep(executionId, remoteJid, pushName, "notify", "success", { numeroNotificacao, tipoPessoa: dados.tipoPessoa }, { notificacaoSalva: true, whatsappEnviado: evolutionConfigurado() }, null, notifDuration)
      } else {
        await logStep(executionId, remoteJid, pushName, "create_lead", "skipped", { remoteJid }, { reason: "lead_already_exists", existingLeadId: existing.id }, null, 0)
      }
    }

    return NextResponse.json({
      status: "ok",
      estado: nextEstado,
      leadCriado: !!leadCriado,
      leadId: leadCriado?.id || null,
      executionId,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    const errStack = error instanceof Error ? error.stack : ""
    console.error("[AI-Webhook] Erro:", errMsg, errStack)
    await logStep(executionId, remoteJidGlobal, pushNameGlobal, "unknown", "error", {}, {}, errMsg, 0)
    return NextResponse.json({ error: "Erro interno", detail: errMsg }, { status: 500 })
  }
}
