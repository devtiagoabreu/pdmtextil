import { NextRequest, NextResponse } from "next/server"
import { authOptions, requireAuth } from "@/lib/auth"
import { verificarAbandonos } from "@/lib/whatsapp/abandon-checker"
import { getServerSession } from "next-auth"
import { requireAdmin } from "@/lib/whatsapp/webhook-auth"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = await getServerSession(authOptions)
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const resultado = await verificarAbandonos()
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[POST /api/admin/whatsapp-abandon]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
