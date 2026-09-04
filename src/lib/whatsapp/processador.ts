import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmWhatsappFila } from "@/lib/db/schema/crm-whatsapp-fila"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmNotificacoes } from "@/lib/db/schema/crm-notificacoes"
import { crmWhatsAppCatalogos } from "@/lib/db/schema/crm-whatsapp-catalogos"
import { crmWhatsAppLinhas } from "@/lib/db/schema/crm-whatsapp-linhas"
import { eq, sql, desc, and } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"
import { enfileirarRetry } from "@/lib/whatsapp/retry-processor"
import crypto from "crypto"
import { buildSystemPrompt } from "@/lib/whatsapp/prompt"
import { rejeitarNome, negou, confirmou, pareceNome, detectarTipo, extrairDoc, parseLinhas, linhasNomes, pediuAtendente, pediuReiniciar, ehSaudacao } from "@/lib/whatsapp/validation"
import { maquinaEstados, type MaquinaEstadoResult } from "@/lib/whatsapp/state-machine"
import { calcularLeadScore } from "@/lib/whatsapp/lead-scoring"
import { chamarGroq, extrairDadosLead } from "@/lib/whatsapp/groq"
import { consultarCNPJ } from "@/lib/whatsapp/cnpj"
import { extrairMensagem, extrairNumero, logStep, type EvolutionWebhookBody } from "@/lib/whatsapp/helpers"
import { verificarAbandonos } from "@/lib/whatsapp/abandon-checker"

const REPRESENTANTE_PJ = process.env.WHATSAPP_REPRESENTANTE_PJ || "5519999999999"
const REPRESENTANTE_PF = process.env.WHATSAPP_REPRESENTANTE_PF || "5519999999998"

async function extrairEnvelope(texto: string): Promise<EvolutionWebhookBody | null> {
  try {
    return JSON.parse(texto)
  } catch {
    try {
      return JSON.parse(Buffer.from(texto, "base64").toString("utf-8"))
    } catch {
      return null
    }
  }
}

export async function enfileirarMensagem(rawText: string, executionId: string) {
  const env = await extrairEnvelope(rawText)
  const remoteJid = env?.data?.key?.remoteJid || env?.remoteJid || env?.sender || ""
  const pushName = env?.data?.pushName || env?.pushName || ""
  const mensagem = extrairMensagem((env as any) || {})

  const dupe = await db
    .select({ id: crmWhatsappFila.id })
    .from(crmWhatsappFila)
    .where(
      and(
        eq(crmWhatsappFila.remoteJid, remoteJid),
        eq(crmWhatsappFila.mensagem, mensagem),
        sql`${crmWhatsappFila.createdAt} > NOW() - INTERVAL '2 minutes' AND ${crmWhatsappFila.status} IN ('PENDENTE','PROCESSANDO')`
      )
    )
    .limit(1)
    .then((r: any) => r[0] || null)

  if (dupe) return null

  const [row] = await db
    .insert(crmWhatsappFila)
    .values({
      remoteJid,
      pushName,
      mensagem,
      executionId,
      payload: { rawText, env: env ?? {} },
    })
    .returning()
  return row
}

export async function marcarFilaStatus(filaId: number | undefined, status: string, erro?: string) {
  if (!filaId) return
  try {
    const set: any = { status, updatedAt: sql`NOW()` }
    if (status === "CONCLUIDO") set.processadoEm = sql`NOW()`
    if (erro !== undefined) set.ultimoErro = erro
    await db.update(crmWhatsappFila).set(set).where(eq(crmWhatsappFila.id, filaId))
  } catch (e) {
    console.error("[WhatsappFila] Erro ao marcar status:", e)
  }
}

export async function executarFluxo(req: NextRequest, filaId?: number | null) {
  if (filaId) {
    await marcarFilaStatus(filaId, "PROCESSANDO")
  }
  const res = await executarFluxoInterno(req)
  if (filaId) {
    if (res.status >= 200 && res.status < 300) {
      await marcarFilaStatus(filaId, "CONCLUIDO")
    } else {
      await marcarFilaStatus(filaId, "FALHOU", `HTTP ${res.status}`)
    }
  }
  return res
}

async function executarFluxoInterno(req: NextRequest) {
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

    // Idempotency check
    const recentSameMsg = await db
      .select({ id: crmWhatsappMensagens.id })
      .from(crmWhatsappMensagens)
      .where(
        and(
          eq(crmWhatsappMensagens.remoteJid, remoteJid),
          eq(crmWhatsappMensagens.mensagem, mensagem),
          eq(crmWhatsappMensagens.tipo, "RECEBIDA"),
          sql`${crmWhatsappMensagens.createdAt} > NOW() - INTERVAL '2 minutes'`
        )
      )
      .limit(1)

    if (recentSameMsg.length > 0) {
      await logStep(executionId, remoteJid, pushName, "filter", "ignored", { duplicate: true }, { reason: "idempotency_duplicate" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "duplicate" })
    }

    if (fromMe) {
      await logStep(executionId, remoteJid, pushName, "filter", "ignored", { fromMe, mensagem }, { reason: "fromMe" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "fromMe" })
    }
    if (!mensagem || !mensagem.trim()) {
      const msgType = body.data?.messageType || ""
      if (msgType && msgType !== "conversation" && msgType !== "extendedTextMessage" && msgType !== "") {
        if (evolutionConfigurado()) {
          const envio = await enviarMensagem(remoteJid, "No momento consigo apenas ler mensagens de texto. Por favor, digite sua resposta.")
          if (!envio.sucesso) {
            await enfileirarRetry(remoteJid, "No momento consigo apenas ler mensagens de texto. Por favor, digite sua resposta.", envio.erro || "send_failed")
          }
        }
        await logStep(executionId, remoteJid, pushName, "filter", "media_detected", { msgType }, { reason: "non_text_message" }, null, 0)
        return NextResponse.json({ status: "ignored", reason: "media_detected" })
      }
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
      .then((r: any) => r[0] || null)

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
        .then((r: any) => r[0] || null)

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

    const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000 // 24h
    const lastUpdate = conversa.updatedAt ? new Date(conversa.updatedAt).getTime() : 0
    if (lastUpdate && (Date.now() - lastUpdate > CONVERSATION_TTL_MS) && conversa.estado !== "SAUDACAO" && conversa.estado !== "HUMANO_ASSUMINDO") {
      const dadosReset: Record<string, any> = {}
      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "SAUDACAO", dados: dadosReset })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
        })
      conversa = { ...conversa, estado: "SAUDACAO", dados: dadosReset }
      await logStep(executionId, remoteJid, pushName, "ttl_reset", "success", { previousState: conversa.estado }, { reason: "conversation_expired_24h" }, null, 0)
    }

    if (pediuReiniciar(mensagem) && conversa.estado !== "SAUDACAO") {
      const dadosReset: Record<string, any> = {}
      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "SAUDACAO", dados: dadosReset })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
        })
      conversa = { ...conversa, estado: "SAUDACAO", dados: dadosReset }

      await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
      await db.insert(crmWhatsappMensagens).values({ mensagem: "Claro! Vamos comecar novamente. Qual o seu nome?", tipo: "ENVIADA", status: "ENVIADA", remoteJid })

      if (evolutionConfigurado()) {
        const envio = await enviarMensagem(remoteJid, "Claro! Vamos comecar novamente. Qual o seu nome?")
        if (!envio.sucesso) {
          await enfileirarRetry(remoteJid, "Claro! Vamos comecar novamente. Qual o seu nome?", envio.erro || "send_failed")
        }
      }

      await logStep(executionId, remoteJid, pushName, "restart", "success", { previousState: conversa.estado }, { reason: "user_requested_restart" }, null, 0)
      return NextResponse.json({ ok: true, restarted: true })
    }

    if (pediuAtendente(mensagem) && conversa.estado !== "AGUARDANDO_REPRESENTANTE" && conversa.estado !== "ENCERRADO" && conversa.estado !== "HUMANO_ASSUMINDO") {
      const nomeFinal = conversa.dados?.nome || pushName || "Anonimo"
      const numero = extrairNumero(remoteJid)

      await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
      await db.insert(crmWhatsappMensagens).values({ mensagem: "Entendido! Vou te conectar com um representante comercial. Aguarde um momento.", tipo: "ENVIADA", status: "ENVIADA", remoteJid })
      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "AGUARDANDO_REPRESENTANTE", dados: conversa.dados || {} })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
        })

      if (evolutionConfigurado()) {
        const envio = await enviarMensagem(remoteJid, "Entendido! Vou te conectar com um representante comercial. Aguarde um momento.")
        if (!envio.sucesso) {
          await enfileirarRetry(remoteJid, "Entendido! Vou te conectar com um representante comercial. Aguarde um momento.", envio.erro || "send_failed")
        }
      }

      try {
        const numeroRep = REPRESENTANTE_PF
        const msgRep = [
          "*Solicitacao de atendimento*",
          "",
          `Nome: ${nomeFinal}`,
          `WhatsApp: https://wa.me/${numero}`,
          "Cliente solicitou falar com um atendente.",
        ].join("\n")
        await enviarMensagem(`${numeroRep}@s.whatsapp.net`, msgRep)
        await db.insert(crmNotificacoes).values({
          tipo: "WHATSAPP_ESCALACAO",
          titulo: "Cliente pediu atendente",
          mensagem: `${nomeFinal} (${remoteJid}) solicitou falar com um atendente.`,
          metadados: { remoteJid, nome: nomeFinal },
          lida: false,
        })
      } catch (e) {
        console.error("[AI-Webhook] Erro ao notificar escalation:", e)
      }

      return NextResponse.json({ ok: true, escalated: true })
    }

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

    if (conversa.estado === "HUMANO_ASSUMINDO") {
      await logStep(executionId, remoteJid, pushName, "state_machine", "ignored", { estado: conversa.estado }, { reason: "human_mode_active" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "human_mode_active", estado: conversa.estado })
    }

    if (conversa.estado === "AGUARDANDO_REPRESENTANTE" || conversa.estado === "ENCERRADO") {
      const numeroRetorno = extrairNumero(remoteJid)
      const leadRetorno = await db
        .select({ id: crmLeads.id, nome: crmLeads.nome, tipoPessoa: crmLeads.tipoPessoa })
        .from(crmLeads)
        .where(
          sql`(${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numeroRetorno)}) AND ${crmLeads.status} != 'CONVERTIDO'`
        )
        .limit(1)
        .then((r: any) => r[0] || null)

      const msgEncerrada = conversa.estado === "ENCERRADO"
        ? "Sua atendimento ja foi finalizado e os catalogos foram enviados. Um representante comercial entrara em contato."
        : "Voce ja esta sendo atendido por um representante comercial. Aguarde o contato dele."
      const msgRetorno =
        "Que bom te-lo(a) de volta! Este canal de contato nao realiza atendimento direto. Vou informar seu representante que voce esta precisando falar e ele entrara em contato em breve."

      const textoCliente = leadRetorno ? msgRetorno : msgEncerrada

      await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
      await db.insert(crmWhatsappMensagens).values({ mensagem: textoCliente, tipo: "ENVIADA", status: "ENVIADA", remoteJid })

      if (evolutionConfigurado()) {
        const envio = await enviarMensagem(remoteJid, textoCliente)
        if (!envio.sucesso) {
          await enfileirarRetry(remoteJid, textoCliente, envio.erro || "send_failed")
        }
      }

      if (leadRetorno) {
        const tipoLabelRetorno = leadRetorno.tipoPessoa === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"
        const repNumeroRetorno = leadRetorno.tipoPessoa === "PJ" ? REPRESENTANTE_PJ : REPRESENTANTE_PF
        const nomeRetorno = leadRetorno.nome || pushName || "Cliente"
        const msgRepRetorno = [
          "*Cliente antigo entrou em contato novamente*",
          "",
          `Nome: ${nomeRetorno}`,
          `WhatsApp: https://wa.me/${numeroRetorno}`,
          `Tipo: ${tipoLabelRetorno}`,
          "",
          "Este cliente ja foi atendido antes pelo bot e esta retornando. Ele deseja falar com voce.",
        ].join("\n")

        try {
          await enviarMensagem(`${repNumeroRetorno}@s.whatsapp.net`, msgRepRetorno)
        } catch (repErr) {
          console.error("[AI-Webhook] Erro ao notificar representante no retorno:", repErr)
        }

        try {
          await db.insert(crmNotificacoes).values({
            tipo: "WHATSAPP_RETORNO",
            titulo: "Cliente antigo retornou",
            mensagem: `${nomeRetorno} (${remoteJid}) entrou em contato novamente. Encaminhado para representante ${tipoLabelRetorno}.`,
            metadados: { remoteJid, nome: nomeRetorno, tipoPessoa: leadRetorno.tipoPessoa, leadId: leadRetorno.id },
            lida: false,
          })
        } catch (notifErr) {
          console.error("[AI-Webhook] Erro ao criar notificacao de retorno:", notifErr)
        }
      }

      await logStep(executionId, remoteJid, pushName, "state_machine", "ignored", { estado: conversa.estado, retorno: !!leadRetorno }, { reason: "conversation_ended" }, null, 0)
      return NextResponse.json({ status: "ignored", reason: "conversation_ended", estado: conversa.estado, retorno: !!leadRetorno })
    }

    if (
      ehSaudacao(mensagem) &&
      (conversa.estado.startsWith("COLETANDO_") || conversa.estado.startsWith("CONFIRMANDO_"))
    ) {
      const numeroRetorno = extrairNumero(remoteJid)
      const leadRetornando = await db
        .select({ id: crmLeads.id, nome: crmLeads.nome, tipoPessoa: crmLeads.tipoPessoa })
        .from(crmLeads)
        .where(
          sql`(${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numeroRetorno)}) AND ${crmLeads.status} != 'CONVERTIDO'`
        )
        .limit(1)
        .then((r: any) => r[0] || null)

      if (leadRetornando) {
        const tipoLabelRetorno = leadRetornando.tipoPessoa === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"
        const repNumeroRetorno = leadRetornando.tipoPessoa === "PJ" ? REPRESENTANTE_PJ : REPRESENTANTE_PF
        const nomeRetorno = leadRetornando.nome || pushName || "Cliente"
        const msgRetornoSaudacao =
          "Que bom te-lo(a) de volta! Este canal de contato nao realiza atendimento direto. Vou informar seu representante que voce esta precisando falar e ele entrara em contato em breve."

        await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
        await db.insert(crmWhatsappMensagens).values({ mensagem: msgRetornoSaudacao, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
        await db
          .insert(crmWhatsappConversas)
          .values({ remoteJid, estado: "AGUARDANDO_REPRESENTANTE", dados: conversa.dados || {} })
          .onConflictDoUpdate({
            target: crmWhatsappConversas.remoteJid,
            set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
          })

        if (evolutionConfigurado()) {
          const envio = await enviarMensagem(remoteJid, msgRetornoSaudacao)
          if (!envio.sucesso) {
            await enfileirarRetry(remoteJid, msgRetornoSaudacao, envio.erro || "send_failed")
          }
        }

        try {
          const msgRep = [
            "*Cliente antigo entrou em contato novamente*",
            "",
            `Nome: ${nomeRetorno}`,
            `WhatsApp: https://wa.me/${numeroRetorno}`,
            `Tipo: ${tipoLabelRetorno}`,
            "",
            "Este cliente ja completou o cadastro anteriormente e retornou. Ele deseja falar com voce.",
          ].join("\n")
          await enviarMensagem(`${repNumeroRetorno}@s.whatsapp.net`, msgRep)
        } catch (repErr) {
          console.error("[AI-Webhook] Erro ao notificar representante no retorno (saudacao):", repErr)
        }

        try {
          await db.insert(crmNotificacoes).values({
            tipo: "WHATSAPP_RETORNO",
            titulo: "Cliente antigo retornou",
            mensagem: `${nomeRetorno} (${remoteJid}) entrou em contato novamente. Encaminhado para representante ${tipoLabelRetorno}.`,
            metadados: { remoteJid, nome: nomeRetorno, tipoPessoa: leadRetornando.tipoPessoa, leadId: leadRetornando.id },
            lida: false,
          })
        } catch (notifErr) {
          console.error("[AI-Webhook] Erro ao criar notificacao de retorno (saudacao):", notifErr)
        }

        await logStep(executionId, remoteJid, pushName, "return_greeting", "success", { estado: conversa.estado, leadId: leadRetornando.id }, { reason: "known_lead_returned" }, null, 0)
        return NextResponse.json({ ok: true, retornoSaudacao: true })
      }
    }

    const historicoRows = await db
      .select({ mensagem: crmWhatsappMensagens.mensagem, tipo: crmWhatsappMensagens.tipo })
      .from(crmWhatsappMensagens)
      .where(eq(crmWhatsappMensagens.remoteJid, remoteJid))
      .orderBy(desc(crmWhatsappMensagens.createdAt))
      .limit(30)
      .then((r: any) => r.reverse())

    const historico: Array<{ role: "user" | "assistant"; content: string }> = historicoRows.map((row: any) => ({
      role: row.tipo === "RECEBIDA" ? "user" : "assistant",
      content: row.mensagem,
    }))

    const tGroq = Date.now()
    const aiResult = await chamarGroq(mensagem, pushName, conversa.estado, conversa.dados || {}, historico, linhasAtivas)
    const groqDuration = Date.now() - tGroq
    const aiResponse = aiResult.conteudo

    const groqError = aiResponse.includes("dificuldades tecnicas") || aiResponse.includes("nao consegui processar")
    await logStep(executionId, remoteJid, pushName, "groq_call", groqError ? "error" : "success", { model: aiResult.modelo || process.env.GROQ_MODEL || "qwen/qwen3.8-27b", provedor: aiResult.provedor, tentativas: aiResult.tentativas, estado: conversa.estado, historicoSize: historico.length, userMessage: mensagem.substring(0, 100) }, { response: aiResponse.substring(0, 200) }, groqError ? "Todos os provedores de IA falharam" : null, groqDuration)

    if (groqError) {
      const retryMsg = "Tive uma dificuldade tecnica. Pode repetir sua mensagem, por favor?"
      await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
      await db.insert(crmWhatsappMensagens).values({ mensagem: retryMsg, tipo: "ENVIADA", status: "ENVIADA", remoteJid })

      if (evolutionConfigurado()) {
        const envio = await enviarMensagem(remoteJid, retryMsg)
        if (!envio.sucesso) {
          await enfileirarRetry(remoteJid, retryMsg, envio.erro || "send_failed")
        }
      }

      const dadosGroq = { ...(conversa.dados || {}) }
      const tentativasGroq = (dadosGroq._groqErros || 0) + 1
      dadosGroq._groqErros = tentativasGroq

      if (tentativasGroq >= 2) {
        const nomeFinal = dadosGroq.nome || pushName || "Anonimo"
        const numero = extrairNumero(remoteJid)
        const motivo = "groq_error_repeated"

        try {
          const existente = await db
            .select({ id: crmLeads.id })
            .from(crmLeads)
            .where(sql`${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numero)}`)
            .limit(1)
            .then((r: any) => r[0] || null)

          if (!existente) {
            const pfLeadScore = calcularLeadScore({ tipoPessoa: "PF", documento: null })
            const [novoLead] = await db.insert(crmLeads).values({
              nome: nomeFinal,
              celular: numero,
              tipoPessoa: "PF",
              origem: "WHATSAPP",
              status: "NOVO",
              descricao: `Lead criado via bot (erro tecnico). Motivo: ${motivo}. Bot falhou ${tentativasGroq}x seguidas. | Score: ${pfLeadScore.score}/100 (${pfLeadScore.prioridade})`,
              idIntegracao: `whatsapp:${remoteJid}`,
              score: pfLeadScore.score,
              prioridade: pfLeadScore.prioridade,
            }).returning()
            dadosGroq.leadId = novoLead.id
          } else {
            dadosGroq.leadId = existente.id
          }
        } catch (leadErr) {
          console.error("[AI-Webhook] Erro ao criar lead groq error:", leadErr)
        }

        const encaminharMsg = "Parece que estou com dificuldades tecnicas no momento. Vou te conectar com um representante comercial que podera ajudar voce."
        await db.insert(crmWhatsappMensagens).values({ mensagem: encaminharMsg, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
        await db
          .insert(crmWhatsappConversas)
          .values({ remoteJid, estado: "AGUARDANDO_REPRESENTANTE", dados: dadosGroq })
          .onConflictDoUpdate({
            target: crmWhatsappConversas.remoteJid,
            set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
          })

        if (evolutionConfigurado()) {
          const envio = await enviarMensagem(remoteJid, encaminharMsg)
          if (!envio.sucesso) {
            await enfileirarRetry(remoteJid, encaminharMsg, envio.erro || "send_failed")
          }

          try {
            const msgRep = [
              "*Atendimento automatico - erro tecnico*",
              "",
              `Nome: ${nomeFinal}`,
              `WhatsApp: https://wa.me/${numero}`,
              `Tipo: Pessoa Fisica`,
              `Motivo: Bot apresentou erro tecnico ${tentativasGroq}x seguidas.`,
              "",
              "Cliente aguarda atendimento.",
            ].join("\n")
            await enviarMensagem(`${REPRESENTANTE_PF}@s.whatsapp.net`, msgRep)
          } catch (repErr) {
            console.error("[AI-Webhook] Erro ao notificar rep groq error:", repErr)
          }
        }

        try {
          await db.insert(crmNotificacoes).values({
            tipo: "WHATSAPP_ERRO_TECNICO",
            titulo: "Bot com erro tecnico",
            mensagem: `Cliente ${nomeFinal} (${remoteJid}) - bot falhou ${tentativasGroq}x. Lead criado e encaminhado para representante PF.`,
            metadados: { remoteJid, nome: nomeFinal, tentativas: tentativasGroq, leadId: dadosGroq.leadId },
            lida: false,
          })
        } catch (notifErr) {
          console.error("[AI-Webhook] Erro ao criar notificacao groq:", notifErr)
        }

        await logStep(executionId, remoteJid, pushName, "groq_fallback", "success", { groqError: true, tentativas: tentativasGroq }, { escalated: true, leadId: dadosGroq.leadId }, null, 0)
        return NextResponse.json({ ok: true, groqEscalated: true })
      }

      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: conversa.estado, dados: dadosGroq })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
        })

      await logStep(executionId, remoteJid, pushName, "groq_fallback", "success", { groqError: true, tentativas: tentativasGroq }, { retried: true }, null, 0)
      return NextResponse.json({ ok: true, groqRetry: true })
    }

    const tState = Date.now()
    const { nextEstado, dados, finalizado, enviarCatalogo, needsCnpjLookup, redirecionarPf } = maquinaEstados(conversa.estado, conversa.dados || {}, mensagem, aiResponse, linhaMap, maxNumero)
    const stateDuration = Date.now() - tState

    await logStep(executionId, remoteJid, pushName, "state_machine", "success", { curEstado: conversa.estado, msg: mensagem.substring(0, 100) }, { nextEstado, dados, finalizado, enviarCatalogo, needsCnpjLookup, redirecionarPf }, null, stateDuration)

    if (redirecionarPf && dados._bloqueado) {
      const motivo = dados._motivoBloqueio || "recusou_corrigir_tipo"
      const nomeFinal = dados.nome && dados.nome.trim().length > 0 ? dados.nome.trim() : "Anonimo"
      const numero = extrairNumero(remoteJid)
      const bloqueioMsg = "Entendido. Um representante comercial entrara em contato para ajudar voce."

      try {
        const existente = await db
          .select({ id: crmLeads.id })
          .from(crmLeads)
          .where(sql`${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numero)}`)
          .limit(1)
          .then((r: any) => r[0] || null)

        if (!existente) {
          const pfLeadScore = calcularLeadScore({ tipoPessoa: "PF", documento: null })
          const [novoLead] = await db.insert(crmLeads).values({
            nome: nomeFinal,
            celular: numero,
            tipoPessoa: "PF",
            origem: "WHATSAPP",
            status: "NOVO",
            descricao: `Lead criado via bot. Motivo: ${motivo}. Cliente recusou corrigir tipo/pessoa. | Score: ${pfLeadScore.score}/100 (${pfLeadScore.prioridade})`,
            idIntegracao: `whatsapp:${remoteJid}`,
            score: pfLeadScore.score,
            prioridade: pfLeadScore.prioridade,
          }).returning()
          dados.leadId = novoLead.id
        } else {
          dados.leadId = existente.id
          await db.update(crmLeads).set({ nome: nomeFinal, tipoPessoa: "PF", updatedAt: sql`NOW()` }).where(eq(crmLeads.id, existente.id))
        }
      } catch (leadErr) {
        console.error("[AI-Webhook] Erro ao criar lead redirecionado PF:", leadErr)
      }

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
        const envio = await enviarMensagem(remoteJid, bloqueioMsg)
        if (!envio.sucesso) {
          await enfileirarRetry(remoteJid, bloqueioMsg, envio.erro || "send_failed")
        }
      }

      try {
        await db.insert(crmNotificacoes).values({
          tipo: "WHATSAPP_REDIRECIONADO_PF",
          titulo: "Cliente redirecionado para PF",
          mensagem: `Cliente ${nomeFinal} (${remoteJid}) recusou corrigir tipo. Motivo: ${motivo}. Redirecionado para representante PF.`,
          metadados: { remoteJid, motivo, nome: nomeFinal, leadId: dados.leadId },
          lida: false,
        })

        if (evolutionConfigurado()) {
          const numero = extrairNumero(remoteJid)
          const msgRep = [
            "*Novo lead - atendimento automatico*",
            "",
            `Nome: ${nomeFinal}`,
            `WhatsApp: https://wa.me/${numero}`,
            `Tipo: Pessoa Fisica`,
            `Motivo: ${motivo}`,
            "",
            "Cliente recusou informar CNPJ/CPF correto e foi redirecionado para voce.",
          ].join("\n")
          await enviarMensagem(`${REPRESENTANTE_PF}@s.whatsapp.net`, msgRep)
        }
      } catch (notifErr) {
        console.error("[AI-Webhook] Erro ao criar notificacao:", notifErr)
      }

      await logStep(executionId, remoteJid, pushName, "pf_redirect", "success", { motivo, leadId: dados.leadId }, { estadoFinal: "AGUARDANDO_REPRESENTANTE" }, null, 0)

      return NextResponse.json({ ok: true, redirected: true })
    }

    if (dados._bloqueado) {
      const motivo = dados._motivoBloqueio || "respostas_invalidas"
      const nomeFinal = dados.nome && dados.nome.trim().length > 0 ? dados.nome.trim() : "Anonimo"
      const numero = extrairNumero(remoteJid)
      const tipoPessoaFinal = dados.tipoPessoa || "PF"
      const repNumero = tipoPessoaFinal === "PJ" ? REPRESENTANTE_PJ : REPRESENTANTE_PF
      const bloqueioMsg = "Parece que nao estou conseguindo entender suas respostas. Um representante comercial entrara em contato para ajudar voce."

      try {
        const existente = await db
          .select({ id: crmLeads.id })
          .from(crmLeads)
          .where(sql`${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numero)}`)
          .limit(1)
          .then((r: any) => r[0] || null)

        if (!existente) {
          const blockedLeadScore = calcularLeadScore({ tipoPessoa: tipoPessoaFinal, documento: dados.documento || null })
          const [novoLead] = await db.insert(crmLeads).values({
            nome: nomeFinal,
            celular: numero,
            tipoPessoa: tipoPessoaFinal,
            origem: "WHATSAPP",
            status: "NOVO",
            descricao: `Lead criado automaticamente via bot (bloqueado). Motivo: ${motivo}. Respostas invalidas 3x seguidas. | Score: ${blockedLeadScore.score}/100 (${blockedLeadScore.prioridade})`,
            idIntegracao: `whatsapp:${remoteJid}`,
            score: blockedLeadScore.score,
            prioridade: blockedLeadScore.prioridade,
          }).returning()
          dados.leadId = novoLead.id
        } else {
          dados.leadId = existente.id
          if (nomeFinal !== "Anonimo") {
            await db.update(crmLeads).set({ nome: nomeFinal, tipoPessoa: tipoPessoaFinal, updatedAt: sql`NOW()` }).where(eq(crmLeads.id, existente.id))
          }
        }
      } catch (leadErr) {
        console.error("[AI-Webhook] Erro ao criar lead bloqueado:", leadErr)
      }

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
        const envio = await enviarMensagem(remoteJid, bloqueioMsg)
        if (!envio.sucesso) {
          await enfileirarRetry(remoteJid, bloqueioMsg, envio.erro || "send_failed")
        }
      }

      const repData = { remoteJid, motivo, nome: nomeFinal, leadId: dados.leadId, estado: "AGUARDANDO_REPRESENTANTE" }
      try {
        const tipoLabel = tipoPessoaFinal === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"
        await db.insert(crmNotificacoes).values({
          tipo: "WHATSAPP_BLOQUEADO",
          titulo: "Cliente bloqueado pelo bot",
          mensagem: `Cliente ${nomeFinal} (${remoteJid}) deu respostas invalidas 3x seguidas. Motivo: ${motivo}. Lead cadastrado como ${tipoLabel}. Redirecionado para representante ${tipoLabel}.`,
          metadados: repData,
          lida: false,
        })

        if (evolutionConfigurado()) {
          const numero = extrairNumero(remoteJid)
          const msgRep = [
            "*Novo lead - atendimento automatico*",
            "",
            `Nome: ${nomeFinal}`,
            `WhatsApp: https://wa.me/${numero}`,
            `Tipo: ${tipoLabel}`,
            `Motivo do bloqueio: ${motivo}`,
            "",
            "Cliente deu respostas invalidas 3x seguidas e foi redirecionado para voce.",
          ].join("\n")
          await enviarMensagem(`${repNumero}@s.whatsapp.net`, msgRep)
        }
      } catch (notifErr) {
        console.error("[AI-Webhook] Erro ao criar notificacao de bloqueio:", notifErr)
      }

      await logStep(executionId, remoteJid, pushName, "blocked_transfer", "success", { motivo, representante: repNumero, nomeFinal, leadId: dados.leadId }, { estadoFinal: "AGUARDANDO_REPRESENTANTE" }, null, 0)

      return NextResponse.json({ ok: true, blocked: true })
    }

    if (needsCnpjLookup && dados.documento) {
      const cnpjLimpo = dados.documento.replace(/\D/g, "")
      const cnpjData = await consultarCNPJ(cnpjLimpo)
      if (cnpjData) {
        dados._cnpjConsulta = cnpjData
        if (cnpjData.razaoSocial) dados.razaoSocial = cnpjData.razaoSocial
        if (cnpjData.nomeFantasia && !dados.nome) dados.nomeContato = cnpjData.nomeFantasia

        const nomeEmpresa = cnpjData.razaoSocial || cnpjData.nomeFantasia || "Empresa"
        const nomeContato = dados.nome || cnpjData.nomeFantasia || ""
        const partesMsg = [
          `Encontrei os seguintes dados para o CNPJ ${dados.documento}:`,
          "",
          `*Razao Social:* ${cnpjData.razaoSocial || "Nao informado"}`,
          cnpjData.nomeFantasia ? `*Nome Fantasia:* ${cnpjData.nomeFantasia}` : null,
          `*Situacao:* ${cnpjData.situacao || "Nao informado"}`,
          cnpjData.endereco ? `*Endereco:* ${cnpjData.endereco}${cnpjData.bairro ? `, ${cnpjData.bairro}` : ""}${cnpjData.cidade ? ` - ${cnpjData.cidade}/${cnpjData.uf}` : ""}` : null,
          "",
          "Esses dados estao corretos? Digite SIM para confirmar ou NAO para prosseguir sem validacao do CNPJ.",
        ].filter(Boolean).join("\n")

        await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
        await db.insert(crmWhatsappMensagens).values({ mensagem: partesMsg, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
        await db
          .insert(crmWhatsappConversas)
          .values({ remoteJid, estado: nextEstado, dados })
          .onConflictDoUpdate({
            target: crmWhatsappConversas.remoteJid,
            set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
          })

        if (evolutionConfigurado()) {
          const envio = await enviarMensagem(remoteJid, partesMsg)
          if (!envio.sucesso) {
            await enfileirarRetry(remoteJid, partesMsg, envio.erro || "send_failed")
          }
        }

        await logStep(executionId, remoteJid, pushName, "cnpj_lookup", "success", { cnpj: cnpjLimpo }, { razaoSocial: cnpjData.razaoSocial, nomeFantasia: cnpjData.nomeFantasia, situacao: cnpjData.situacao }, null, 0)

        return NextResponse.json({ ok: true, cnpjLookup: true })
      } else {
        const tentativaAtual = (dados._cnpjTentativas || 0) + 1
        dados._cnpjTentativas = tentativaAtual

        if (tentativaAtual < 2) {
          const retryMsg = `Nao consegui consultar o CNPJ ${dados.documento} na Receita Federal. Por favor, verifique se o numero esta correto e informe novamente.`

          await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
          await db.insert(crmWhatsappMensagens).values({ mensagem: retryMsg, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
          await db
            .insert(crmWhatsappConversas)
            .values({ remoteJid, estado: nextEstado, dados })
            .onConflictDoUpdate({
              target: crmWhatsappConversas.remoteJid,
              set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
            })

          if (evolutionConfigurado()) {
            const envio = await enviarMensagem(remoteJid, retryMsg)
            if (!envio.sucesso) {
              await enfileirarRetry(remoteJid, retryMsg, envio.erro || "send_failed")
            }
          }

          await logStep(executionId, remoteJid, pushName, "cnpj_lookup", "retry", { cnpj: cnpjLimpo, tentativa: tentativaAtual }, { fallback: false }, "API lookup failed, asking retry", 0)

          return NextResponse.json({ ok: true, cnpjLookupRetry: true })
        } else {
          dados._cnpjSemDados = true
          dados.tipoPessoa = "PJ"
          const confirmarMsg = `Nao foi possivel consultar o CNPJ ${dados.documento} na Receita Federal. Posso seguir usando esse CNPJ como Pessoa Juridica? Responda SIM para confirmar.`

          await db.insert(crmWhatsappMensagens).values({ mensagem, tipo: "RECEBIDA", status: "RECEBIDA", remoteJid })
          await db.insert(crmWhatsappMensagens).values({ mensagem: confirmarMsg, tipo: "ENVIADA", status: "ENVIADA", remoteJid })
          await db
            .insert(crmWhatsappConversas)
            .values({ remoteJid, estado: "CONFIRMANDO_DADOS_CNPJ", dados })
            .onConflictDoUpdate({
              target: crmWhatsappConversas.remoteJid,
              set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
            })

          if (evolutionConfigurado()) {
            const envio = await enviarMensagem(remoteJid, confirmarMsg)
            if (!envio.sucesso) {
              await enfileirarRetry(remoteJid, confirmarMsg, envio.erro || "send_failed")
            }
          }

          await logStep(executionId, remoteJid, pushName, "cnpj_lookup", "fallback_confirm", { cnpj: cnpjLimpo, tentativa: tentativaAtual }, { estado: "CONFIRMANDO_DADOS_CNPJ" }, "API lookup failed twice, asking user to confirm CNPJ", 0)

          return NextResponse.json({ ok: true, cnpjLookupFallback: true })
        }
      }
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
        await enfileirarRetry(remoteJid, aiResponse, envio.erro || "send_failed")
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
              ...cats.map((c: any) => `*${c.titulo}*\n${c.descricao || ""}\n${c.linkUrl}`),
            ].join("\n")
            const envio = await enviarMensagem(remoteJid, linhas)
            if (!envio.sucesso) {
              await enfileirarRetry(remoteJid, linhas, envio.erro || "send_failed")
            }
          }

          const linhasSemCatalogo = enviarCatalogo.filter((n: any) => !linhasAgrupadas[n])
          if (linhasSemCatalogo.length > 0) {
            const nomesSemCatalogo = linhasSemCatalogo.map((n: any) => linhaMap[n] || `Linha ${n}`).join(", ")
            const msgSemCatalogo = `As seguintes linhas ainda nao possuem catalogo disponivel: ${nomesSemCatalogo}. Um representante comercial entrara em contato com mais informacoes.`
            const envio = await enviarMensagem(remoteJid, msgSemCatalogo)
            if (!envio.sucesso) {
              await enfileirarRetry(remoteJid, msgSemCatalogo, envio.erro || "send_failed")
            }
          }

          await logStep(executionId, remoteJid, pushName, "send_catalog", "success", { linhas: enviarCatalogo, totalCatalogos: catalogos.length, linhasSemCatalogo }, { catalogosEnviados: true }, null, Date.now() - tCat)
        } else {
          const envio = await enviarMensagem(remoteJid, "No momento nao temos catalogos disponiveis para as linhas selecionadas. Um representante comercial entrara em contato com mais informacoes.")
          if (!envio.sucesso) {
            await enfileirarRetry(remoteJid, "No momento nao temos catalogos disponiveis para as linhas selecionadas. Um representante comercial entrara em contato com mais informacoes.", envio.erro || "send_failed")
          }
          await logStep(executionId, remoteJid, pushName, "send_catalog", "empty", { linhas: enviarCatalogo }, { catalogosEnviados: false, reason: "no_active_catalogs" }, null, Date.now() - tCat)
        }
      } catch (catErr) {
        console.error("[AI-Webhook] Erro ao enviar catalogos:", catErr)
        await logStep(executionId, remoteJid, pushName, "send_catalog", "error", { linhas: enviarCatalogo }, {}, catErr instanceof Error ? catErr.message : "Unknown error", Date.now() - tCat)
      }
    }

    if (finalizado && evolutionConfigurado()) {
      const envio = await enviarMensagem(remoteJid, "Um representante comercial entrara em contato em breve.")
      if (!envio.sucesso) {
        await enfileirarRetry(remoteJid, "Um representante comercial entrara em contato em breve.", envio.erro || "send_failed")
      }
    }

    if (finalizado && dados.nome) {
      const existing = await db
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`))
        .limit(1)
        .then((r: any) => r[0] || null)

      if (!existing) {
        const tLead = Date.now()
        const numero = extrairNumero(remoteJid)
        const leadScore = calcularLeadScore({
          tipoPessoa: dados.tipoPessoa,
          documento: dados.documento,
          linhasInteresse: dados.linhasInteresse,
          razaoSocial: dados._cnpjConsulta?.razaoSocial,
          _cnpjConsulta: dados._cnpjConsulta,
        })
        const descricaoParts: string[] = []
        if (dados.documento) descricaoParts.push(`Documento: ${dados.documento}`)
        if (dados.tipoPessoa) descricaoParts.push(`Tipo: ${dados.tipoPessoa}`)
        if (dados.linhasInteresseNomes) descricaoParts.push(`Interesse: ${dados.linhasInteresseNomes}`)
        if (dados._cnpjConsulta) descricaoParts.push(`Razao Social: ${dados._cnpjConsulta.razaoSocial}`)
        if (dados._cnpjSemDados) descricaoParts.push("CNPJ nao consultado na Receita Federal")
        descricaoParts.push(`Lead finalizado via WhatsApp | Score: ${leadScore.score}/100 (${leadScore.prioridade})`)
        descricaoParts.push(
          `Encaminhado para representante: ${dados.tipoPessoa === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"} | Atendido pela IA: ${aiResult.nomeChave ? `${aiResult.provedor} (${aiResult.nomeChave})` : `${aiResult.provedor} (${aiResult.modelo})`}`
        )

        const dadosExtraidos = await extrairDadosLead(historico, pushName).catch((): Partial<import("@/lib/whatsapp/groq").DadosLeadExtraidos> => ({}))

        let nomeLead: string
        if (dados.tipoPessoa === "PJ" && dados._cnpjConsulta?.razaoSocial) {
          nomeLead = dados._cnpjConsulta.nomeFantasia || dados._cnpjConsulta.razaoSocial
        } else {
          nomeLead = dadosExtraidos.nome || dados.nome
        }
        const ehSaudacao = /^(ola|olá|oi|oe|eai|e aí|cliente|anonimo|bom dia|boa tarde|boa noite)$/i.test((nomeLead || "").trim())
        if (!nomeLead || nomeLead.trim().length === 0 || ehSaudacao) {
          nomeLead = "Anonimo"
        }

        const documentoLead = dados.documento || dadosExtraidos.documento || null
        const tipoPessoaLead = dados.tipoPessoa || (dadosExtraidos.tipoPessoa ? (dadosExtraidos.tipoPessoa === "PJ" ? "PJ" : "PF") : null)
        const emailLead = dadosExtraidos.email || null
        const telefoneLead = dadosExtraidos.telefone || null
        const empresaNomeLead = dados._cnpjConsulta?.razaoSocial || dados.razaoSocial || dadosExtraidos.empresa || null

        const [novo] = await db
          .insert(crmLeads)
          .values({
            nome: nomeLead,
            celular: numero,
            email: emailLead,
            telefone: telefoneLead,
            empresaNome: empresaNomeLead,
            documento: documentoLead,
            tipoPessoa: tipoPessoaLead,
            origem: "WHATSAPP",
            descricao: descricaoParts.join(" | "),
            idIntegracao: `whatsapp:${remoteJid}`,
            score: leadScore.score,
            prioridade: leadScore.prioridade,
          })
          .returning()

        leadCriado = novo
        const leadDuration = Date.now() - tLead
        await logStep(executionId, remoteJid, pushName, "create_lead", "success", { nome: dados.nome, numero, tipoPessoa: dados.tipoPessoa, documento: dados.documento, score: leadScore.score, prioridade: leadScore.prioridade }, { leadId: novo.id, idIntegracao: `whatsapp:${remoteJid}`, motivos: leadScore.motivos }, null, leadDuration)

        const tNotif = Date.now()
        const ehPJ = dados.tipoPessoa === "PJ"
        const numeroNotificacao = ehPJ ? REPRESENTANTE_PJ : REPRESENTANTE_PF
        const tipoLabelLead = ehPJ ? "Pessoa Juridica" : "Pessoa Fisica"
        const iaUsada = aiResult.nomeChave
          ? `${aiResult.provedor} (${aiResult.nomeChave})`
          : `${aiResult.provedor} (${aiResult.modelo})`
        const scoreTexto = `Score: ${leadScore.score}/100 (${leadScore.prioridade})`
        const textoNotificacao = [
          "*Novo lead cadastrado no CRM*",
          "",
          `Nome: ${nomeLead}`,
          `WhatsApp: https://wa.me/${numero}`,
          `Tipo: ${tipoLabelLead}`,
          `Documento: ${dados.documento || "Nao informado"}`,
          dados._cnpjConsulta?.razaoSocial ? `Razao Social: ${dados._cnpjConsulta.razaoSocial}` : "",
          dados._cnpjConsulta?.nomeFantasia ? `Nome Fantasia: ${dados._cnpjConsulta.nomeFantasia}` : "",
          dados.linhasInteresseNomes ? `Interesse: ${dados.linhasInteresseNomes}` : "",
          "",
          `Encaminhado para representante: ${tipoLabelLead}`,
          `Atendido pela IA: ${iaUsada}`,
          "",
          scoreTexto,
          leadScore.motivos.length > 0 ? `Motivos: ${leadScore.motivos.join(", ")}` : "",
          "",
          "Dados capturados pelo atendente automatico.",
        ].filter(Boolean).join("\n")

        await db.insert(crmNotificacoes).values({
          titulo: "Novo lead cadastrado via WhatsApp",
          mensagem: textoNotificacao,
          tipo: "lead_novo",
          link: "/comercial/crm/leads",
          metadados: { leadId: novo.id, remoteJid, pushName, representante: tipoLabelLead, iaProvedor: aiResult.provedor, iaModelo: aiResult.modelo, iaNomeChave: aiResult.nomeChave || null },
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

    // Check for abandoned conversations (lightweight, runs on each webhook)
    try {
      await verificarAbandonos()
    } catch (e) {
      // silent - abandonment check is non-critical
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

