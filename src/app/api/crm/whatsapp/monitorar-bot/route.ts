import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { executarMonitoramento } from "@/lib/whatsapp/monitoramento"

export const dynamic = "force-dynamic"
export const maxDuration = 60

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

    const resultado = await executarMonitoramento()
    return NextResponse.json({ status: "ok", ...resultado })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp/monitorar-bot]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}