import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmNotificacoes } from "@/lib/db/schema/crm-notificacoes"
import { eq, sql, desc } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"

export const dynamic = "force-dynamic"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const REPRESENTANTE_PJ = process.env.WHATSAPP_REPRESENTANTE_PJ || "5519999999999"
const REPRESENTANTE_PF = process.env.WHATSAPP_REPRESENTANTE_PF || "5519999999998"

const SYSTEM_PROMPT = `Voce e o assistente de vendas virtual da Pro Moda Textil, uma industria textil brasileira especializada em tecidos planos, hospitalares e industriais.

FLUXO DA CONVERSA:
Estado SAUDACAO: Apresente-se e pergunte "Qual o seu nome?".
Estado COLETANDO_NOME: Extraia apenas o nome proprio do usuario (ex: se ele disser "Meu nome e Tiago", registre apenas "Tiago"). Confirme: "Prazer em te conhecer, [NOME]!".
Estado COLETANDO_INTERESSE: Informe que todas as linhas sao de tecidos planos e pergunte em qual linha ele tem interesse. Use lista numerada:
"Todas as nossas linhas sao de tecidos planos. Qual dessas mais te interessa hoje?
1 - Linha Lencol
2 - Linha Hospitalar (lencois e campos)
3 - Tecidos para Lateral de Colchao
4 - Tecidos Rusticos e Decoracao
5 - Movelaria e Forros"
Estado COLETANDO_DOC: Pergunte "Voce e pessoa fisica ou juridica? Digite:
1 - Pessoa Fisica (PF)
2 - Pessoa Juridica (PJ)"
Depois, informe o seu CPF ou CNPJ.
Estado CONFIRMACAO: Mostre o resumo dos dados e da linha de interesse. Pergunte "Esta correto? Digite SIM para confirmar."
Estado ENCERRADO: Informe "Seu contato foi direcionado para um representante comercial, que entrara em contato em ate 10 min." Agradeca.

CONTEXTO:
- Cliente: {{pushName}}
- Estado: {{estado}}
- Dados: {{dados}}

REGRAS OBRIGATORIAS - O QUE VOCE DEVE FAZER:
- Use portugues brasileiro natural, cordial e profissional.
- Maximo 3 linhas por mensagem.
- Faca apenas UMA pergunta de cada vez.
- Extraia o nome proprio ignorando preambulos como "Meu nome e", "Pode me chamar de" ou "Eu sou".
- Use listas numeradas e quebras de linha para opcoes multiplas.
- Deixe claro que todas as linhas sao de tecidos planos.
- Para PF colete: nome, CPF, tipoPessoa=PF.
- Para PJ colete: nome, CNPJ, tipoPessoa=PJ.

REGRAS OBRIGATORIAS - O QUE VOCE NAO PODE FAZER:
- NAO use emojis em hipotese alguma.
- NAO invente informacoes sobre produtos, precos ou prazos.
- NAO responda sobre assuntos fora do escopo de vendas e atendimento.
- NAO compartilhe dados de outros clientes.
- NAO faça promessas de entrega ou estoque.
- NAO use linguagem tecnica ou formal demais.
- NAO envie mais de uma mensagem por vez.
- NAO repita a pergunta ja feita.
- NAO mude de assunto antes de completar o fluxo atual.`

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

interface MaquinaEstadoResult {
  nextEstado: string
  dados: Record<string, any>
  resposta?: string
  finalizado: boolean
}

function maquinaEstados(
  curEstado: string,
  curDados: Record<string, any>,
  msgOriginal: string,
  aiResponse: string
): MaquinaEstadoResult {
  const msg = msgOriginal.toLowerCase().trim()
  let nextEstado = curEstado
  const dados = JSON.parse(JSON.stringify(curDados))

  if (curEstado === "SAUDACAO") {
    nextEstado = "COLETANDO_NOME"
  } else if (curEstado === "COLETANDO_NOME") {
    if (msgOriginal.length > 2 && pareceNome(msgOriginal)) {
      dados.nome = msgOriginal
      nextEstado = "COLETANDO_DOC"
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
      nextEstado = "CONFIRMACAO"
    }
  } else if (curEstado === "CONFIRMACAO") {
    if (confirmou(msg)) {
      nextEstado = "ENCERRADO"
      dados.finalizado = true
    }
  } else if (curEstado === "ENCERRADO") {
    dados.finalizado = true
  }

  return { nextEstado, dados, finalizado: !!dados.finalizado }
}

async function chamarGroq(
  userMessage: string,
  pushName: string,
  estado: string,
  dados: Record<string, any>,
  historico: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === "cole-sua-chave-groq-aqui") {
    console.error("[Groq] GROQ_API_KEY não configurada")
    return "Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em instantes."
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

  const systemMessage = SYSTEM_PROMPT.replace("{{pushName}}", pushName)
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

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.PDM_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("[AI-Webhook] PDM_WEBHOOK_SECRET não configurado")
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 })
    }

    const authHeader = req.headers.get("authorization")
    const querySecret = req.nextUrl.searchParams.get("secret")
    if (authHeader !== `Bearer ${webhookSecret}` && querySecret !== webhookSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body: EvolutionWebhookBody = await req.json()

    const pushName = body.data?.pushName || body.pushName || ""
    const remoteJid = body.data?.key?.remoteJid || body.remoteJid || body.sender || ""
    const fromMe = body.data?.key?.fromMe === true
    const mensagem = extrairMensagem(body)

    if (fromMe) {
      return NextResponse.json({ status: "ignored", reason: "fromMe" })
    }
    if (!mensagem || !mensagem.trim()) {
      return NextResponse.json({ status: "ignored", reason: "empty" })
    }
    if (!remoteJid) {
      return NextResponse.json({ status: "ignored", reason: "no_sender" })
    }

    let conversa = await db
      .select()
      .from(crmWhatsappConversas)
      .where(eq(crmWhatsappConversas.remoteJid, remoteJid))
      .limit(1)
      .then((r) => r[0] || null)

    if (!conversa) {
      const numero = extrairNumero(remoteJid)
      const leadExistente = await db
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

      if (leadExistente) {
        if (leadExistente.empresaNome) dadosIniciais.razaoSocial = leadExistente.empresaNome
        if (leadExistente.nome) dadosIniciais.nomeContato = leadExistente.nome
        if (leadExistente.tipoPessoa) dadosIniciais.tipoPessoa = leadExistente.tipoPessoa
        estadoInicial = leadExistente.empresaNome ? "AGUARDANDO_REPRESENTANTE" : "COLETANDO_DADOS"
      }

      const [nova] = await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: estadoInicial, dados: dadosIniciais })
        .returning()
      conversa = nova
    }

    if (conversa.estado === "AGUARDANDO_REPRESENTANTE" || conversa.estado === "ENCERRADO") {
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

    const aiResponse = await chamarGroq(
      mensagem,
      pushName,
      conversa.estado,
      conversa.dados || {},
      historico
    )

    const { nextEstado, dados, finalizado } = maquinaEstados(
      conversa.estado,
      conversa.dados || {},
      mensagem,
      aiResponse
    )

    await db
      .insert(crmWhatsappMensagens)
      .values({
        mensagem,
        tipo: "RECEBIDA",
        status: "RECEBIDA",
        remoteJid,
      })

    await db
      .insert(crmWhatsappMensagens)
      .values({
        mensagem: aiResponse,
        tipo: "ENVIADA",
        status: "ENVIADA",
        remoteJid,
      })

    await db
      .insert(crmWhatsappConversas)
      .values({ remoteJid, estado: nextEstado, dados })
      .onConflictDoUpdate({
        target: crmWhatsappConversas.remoteJid,
        set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
      })

    if (evolutionConfigurado()) {
      const envio = await enviarMensagem(remoteJid, aiResponse)
      if (!envio.sucesso) {
        console.error("[AI-Webhook] Falha ao enviar:", envio.erro)
      }
    }

    let leadCriado = null

    if (finalizado && dados.nome) {
      const existing = await db
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`))
        .limit(1)
        .then((r) => r[0] || null)

      if (!existing) {
        const numero = extrairNumero(remoteJid)
        const descricaoParts: string[] = []
        if (dados.documento) descricaoParts.push(`Documento: ${dados.documento}`)
        if (dados.tipoPessoa) descricaoParts.push(`Tipo: ${dados.tipoPessoa}`)
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

        const numeroNotificacao = dados.tipoPessoa === "PJ" ? REPRESENTANTE_PJ : REPRESENTANTE_PF
        const textoNotificacao = [
          "*Novo lead cadastrado no CRM*",
          "",
          `Nome: ${dados.nome}`,
          `Telefone: ${numero}`,
          `Tipo: ${dados.tipoPessoa === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"}`,
          `Documento: ${dados.documento || "Nao informado"}`,
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
      }
    }

    return NextResponse.json({
      status: "ok",
      estado: nextEstado,
      leadCriado: !!leadCriado,
      leadId: leadCriado?.id || null,
    })
  } catch (error) {
    console.error("[AI-Webhook] Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
