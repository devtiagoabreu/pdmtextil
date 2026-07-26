import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { processarRetryQueue } from "@/lib/whatsapp/retry-processor"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const resultado = await processarRetryQueue()
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[POST /api/admin/whatsapp-retry]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
