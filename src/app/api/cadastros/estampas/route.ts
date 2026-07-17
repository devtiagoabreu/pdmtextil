import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { estampas } from "@/lib/db/schema/estampas"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select()
      .from(estampas)
      .orderBy(estampas.nome)

    return NextResponse.json(lista)
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/estampas")
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()

    const novaEstampa = await db
      .insert(estampas)
      .values({
        codigoDesenho: body.codigoDesenho,
        variante: body.variante || "01",
        nome: body.nome,
        tipo: body.tipo || null,
        imagemUrl: body.imagemUrl || null,
        ativo: body.ativo ?? true,
        idIntegracao: body.idIntegracao || null,
      })
      .returning()

    return NextResponse.json(novaEstampa[0])
  } catch (error) {
    return handleApiError(error, "POST /api/cadastros/estampas")
  }
}