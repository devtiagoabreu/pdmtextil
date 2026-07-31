import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { aiChaves } from "@/lib/db/schema/ai-chaves"
import { eq } from "drizzle-orm"
import { testarChave } from "@/lib/ai"

export const dynamic = "force-dynamic"

function mascarar(chave: string): string {
  if (!chave) return ""
  if (chave.length <= 8) return "********"
  return `${chave.slice(0, 4)}...${chave.slice(-4)}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    let chave

    if (body.id) {
      const [existente] = await db.select().from(aiChaves).where(eq(aiChaves.id, body.id))
      if (!existente) return NextResponse.json({ error: "Chave não encontrada" }, { status: 404 })
      chave = {
        ...existente,
        chaveApi: body.chaveApi && body.chaveApi !== mascarar(existente.chaveApi) ? body.chaveApi : existente.chaveApi,
      }
    } else {
      chave = body
    }

    if (!chave?.chaveApi) return NextResponse.json({ error: "chaveApi é obrigatório" }, { status: 400 })

    const resultado = await testarChave(chave)
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[POST /api/admin/ai-chaves/testar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
