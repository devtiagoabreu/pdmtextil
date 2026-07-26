import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { verificarAbandonos } from "@/lib/whatsapp/abandon-checker"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const resultado = await verificarAbandonos()
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[POST /api/admin/whatsapp-abandon]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
