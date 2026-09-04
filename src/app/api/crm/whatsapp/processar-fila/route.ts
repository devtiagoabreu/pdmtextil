import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappFila } from "@/lib/db/schema/crm-whatsapp-fila"
import { and, inArray, lt, asc } from "drizzle-orm"
import { executarFluxo, marcarFilaStatus } from "@/lib/whatsapp/processador"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const LIMITE_POR_RODADA = 5
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pdmprotextil.vercel.app"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    const session = await getServerSession(authOptions).catch(() => null)
    const isCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)
    const isAdmin =
      session && (session.user.role === "ADMIN" || session.user.role === "SUDO" || session.user.role === "CRM")
    if (!isCron && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const webhookSecret = process.env.PDM_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 })
    }

    const pendentes = await db
      .select()
      .from(crmWhatsappFila)
      .where(
        and(
          inArray(crmWhatsappFila.status, ["PENDENTE", "PROCESSANDO"]),
          lt(crmWhatsappFila.tentativas, crmWhatsappFila.maxTentativas)
        )
      )
      .orderBy(asc(crmWhatsappFila.createdAt))
      .limit(LIMITE_POR_RODADA)

    let processadas = 0
    let comErro = 0

    for (const item of pendentes) {
      try {
        await marcarFilaStatus(item.id, "PROCESSANDO")
        const rawText = item.payload?.rawText || ""
        if (!rawText) {
          await marcarFilaStatus(item.id, "FALHOU", "payload sem rawText")
          comErro++
          continue
        }
        const internal = new NextRequest(`${BASE_URL}/api/crm/whatsapp/ai-webhook`, {
          method: "POST",
          headers: { authorization: `Bearer ${webhookSecret}` },
          body: rawText,
        })
        const res = await executarFluxo(internal, item.id)
        if (res.status >= 200 && res.status < 300) {
          processadas++
        } else {
          comErro++
        }
      } catch (e) {
        comErro++
        console.error("[WhatsappFila] Erro ao processar item", item.id, e)
        await marcarFilaStatus(item.id, "PENDENTE", e instanceof Error ? e.message : "erro")
      }
    }

    return NextResponse.json({ status: "ok", processadas, comErro, filaId: pendentes.map((p: any) => p.id) })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Erro interno"
    console.error("[WhatsappFila] Erro no drain:", error)
    return NextResponse.json({ error: "Erro interno", detail: errMsg }, { status: 500 })
  }
}
