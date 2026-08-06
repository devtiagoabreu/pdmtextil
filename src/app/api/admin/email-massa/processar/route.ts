import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailDisparos } from "@/lib/db/schema/email-disparos"
import { emailEnviados, type EmailEnviado } from "@/lib/db/schema/email-enviados"
import { emailConfig } from "@/lib/db/schema/email-config"
import { userEmailConfig } from "@/lib/db/schema/user-email-config"
import { and, asc, eq, inArray, sql } from "drizzle-orm"
import { decrypt } from "@/lib/crypto"
import { aplicarTracking, injectPreheader } from "@/lib/email-massa"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const BCC_CHUNK = 50
const INDIVIDUAL_BATCH = 20
const MAX_RUN_MS = 280_000
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pdmprotextil.vercel.app"

async function recomputarContadores(disparoId: number) {
  await db
    .update(emailDisparos)
    .set({
      enviados: sql`(select count(*) from email_enviados where disparo_id = ${disparoId} and status = 'enviado')`,
      falhas: sql`(select count(*) from email_enviados where disparo_id = ${disparoId} and status = 'falhou')`,
    })
    .where(eq(emailDisparos.id, disparoId))
}

async function finalizar(disparoId: number) {
  await recomputarContadores(disparoId)
  await db
    .update(emailDisparos)
    .set({ status: "concluido", concluidoEm: new Date() })
    .where(eq(emailDisparos.id, disparoId))
}

async function marcarErroTransporte(disparoId: number, msg: string) {
  await db
    .update(emailDisparos)
    .set({ status: "erro", erro: msg, concluidoEm: new Date() })
    .where(eq(emailDisparos.id, disparoId))
}

function isFalhaTransiente(err: any): boolean {
  const code = err?.code
  const rc = err?.responseCode
  if (code && ["ECONNECTION", "EAUTH", "ETIMEDOUT", "ESOCKET", "ECONNRESET"].includes(code)) return true
  if (rc != null) {
    if (rc >= 500) return true
    if ([421, 450, 451, 452].includes(rc)) return true
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    const session = await getServerSession(authOptions).catch(() => null)
    const isAdmin =
      session && (session.user.role === "ADMIN" || session.user.role === "SUDO" || session.user.role === "CRM")
    if (!(cronSecret && authHeader === `Bearer ${cronSecret}`) && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const startedAt = Date.now()
    const elapsed = () => Date.now() - startedAt
    let enviadosNoRun = 0
    let falhasNoRun = 0
    let disparosProcessados = 0

    const disparos = await db
      .select()
      .from(emailDisparos)
      .where(inArray(emailDisparos.status, ["fila", "enviando"]))
      .orderBy(asc(emailDisparos.id))

    for (const d of disparos) {
      if (elapsed() > MAX_RUN_MS) break

      await db
        .update(emailDisparos)
        .set({ status: "enviando", iniciadoEm: sql`coalesce(${emailDisparos.iniciadoEm}, now())` })
        .where(eq(emailDisparos.id, d.id))

      let tc: { host: string; port: number; user: string; pass: string; fromName: string }
      if (d.remetente === "usuario" && d.criadoPor) {
        const cfgs = await db.select().from(userEmailConfig).where(eq(userEmailConfig.usuarioId, d.criadoPor)).limit(1)
        if (cfgs.length === 0) {
          await marcarErroTransporte(d.id, "Configuração de email do usuário não encontrada")
          continue
        }
        const cfg = cfgs[0]
        tc = { host: cfg.host, port: cfg.port, user: cfg.email, pass: decrypt(cfg.senhaApp), fromName: cfg.email.split("@")[0] }
      } else {
        const cfgs = await db.select().from(emailConfig).where(eq(emailConfig.ativo, true)).limit(1)
        if (cfgs.length === 0) {
          await marcarErroTransporte(d.id, "Nenhuma configuração SMTP ativa encontrada")
          continue
        }
        const cfg = cfgs[0]
        tc = { host: cfg.host, port: cfg.port, user: cfg.user, pass: decrypt(cfg.pass), fromName: cfg.fromName || "PDM Têxtil" }
      }

      const transporter = nodemailer.createTransport({
        host: tc.host,
        port: tc.port,
        secure: tc.port === 465,
        auth: { user: tc.user, pass: tc.pass },
      })

      try {
        await transporter.verify()
      } catch (err: any) {
        await marcarErroTransporte(d.id, `Falha ao conectar ao SMTP: ${err?.message || "erro desconhecido"}`)
        transporter.close()
        continue
      }

      const htmlBase = injectPreheader(d.html, d.preheader || "")

      const atualizarEnvio = (id: number, ok: boolean, trackingId: string | null, error: string | null) =>
        db
          .update(emailEnviados)
          .set({ status: ok ? "enviado" : "falhou", trackingId: ok ? trackingId : null, error: ok ? null : error })
          .where(eq(emailEnviados.id, id))

      const buscarPendentes = (limit: number) =>
        db
          .select()
          .from(emailEnviados)
          .where(and(eq(emailEnviados.disparoId, d.id), eq(emailEnviados.status, "pendente")))
          .orderBy(asc(emailEnviados.id))
          .limit(limit)

      let pararDreno = false

      if (d.modoEnvio === "bcc") {
        while (!pararDreno && elapsed() <= MAX_RUN_MS) {
          const chunk: EmailEnviado[] = await buscarPendentes(BCC_CHUNK)
          if (chunk.length === 0) break
          const trackingId = crypto.randomUUID()
          const html = aplicarTracking(htmlBase.replace(/\[NOME\]/g, "Cliente"), trackingId, BASE_URL)
          try {
            await transporter.sendMail({
              from: `"${tc.fromName}" <${tc.user}>`,
              to: chunk[0].email,
              bcc: chunk.slice(1).map((p: EmailEnviado) => p.email),
              subject: d.assunto,
              html,
            })
            for (let j = 0; j < chunk.length; j++) {
              await atualizarEnvio(chunk[j].id, true, j === 0 ? trackingId : null, null)
            }
            enviadosNoRun += chunk.length
          } catch (err: any) {
            if (isFalhaTransiente(err)) {
              await marcarErroTransporte(d.id, err?.message || "Erro SMTP")
              pararDreno = true
            } else {
              for (const p of chunk) {
                await atualizarEnvio(p.id, false, null, err?.message || "Erro SMTP")
              }
              falhasNoRun += chunk.length
            }
          }
        }
      } else {
        while (!pararDreno && elapsed() <= MAX_RUN_MS) {
          const batch: EmailEnviado[] = await buscarPendentes(INDIVIDUAL_BATCH)
          if (batch.length === 0) break
          for (const p of batch) {
            if (elapsed() > MAX_RUN_MS) {
              pararDreno = true
              break
            }
            const trackingId = crypto.randomUUID()
            const nome = d.modoEnvio === "individual" ? p.nome || "Cliente" : "Cliente"
            const html = aplicarTracking(htmlBase.replace(/\[NOME\]/g, nome), trackingId, BASE_URL)
            try {
              await transporter.sendMail({
                from: `"${tc.fromName}" <${tc.user}>`,
                to: p.email,
                subject: d.assunto,
                html,
              })
              await atualizarEnvio(p.id, true, trackingId, null)
              enviadosNoRun++
            } catch (err: any) {
              if (isFalhaTransiente(err)) {
                await marcarErroTransporte(d.id, err?.message || "Erro SMTP")
                pararDreno = true
                break
              }
              await atualizarEnvio(p.id, false, null, err?.message || "Erro SMTP")
              falhasNoRun++
            }
          }
        }
      }

      transporter.close()
      await recomputarContadores(d.id)

      const restantesDisparo = await db
        .select({ total: sql<number>`count(*)` })
        .from(emailEnviados)
        .where(and(eq(emailEnviados.disparoId, d.id), eq(emailEnviados.status, "pendente")))
      if (Number(restantesDisparo[0]?.total || 0) === 0) {
        await finalizar(d.id)
      }
      disparosProcessados++
    }

    const contagemPendente = await db
      .select({ total: sql<number>`count(*)` })
      .from(emailEnviados)
      .where(eq(emailEnviados.status, "pendente"))
    const restantes = Number(contagemPendente[0]?.total || 0)

    return NextResponse.json({
      disparosProcessados,
      enviados: enviadosNoRun,
      falhas: falhasNoRun,
      restantes,
      limiteTempo: elapsed() > MAX_RUN_MS,
    })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa/processar]", error)
    return NextResponse.json({ error: "Erro ao processar disparos" }, { status: 500 })
  }
}
