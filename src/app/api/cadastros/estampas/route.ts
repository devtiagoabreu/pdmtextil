import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { estampas } from "@/lib/db/schema/estampas"
import { eq } from "drizzle-orm"

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
    console.error("[GET /api/cadastros/estampas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
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
      })
      .returning()

    return NextResponse.json(novaEstampa[0])
  } catch (error) {
    console.error("[POST /api/cadastros/estampas]", error)
    return NextResponse.json({ error: "Erro ao criar estampa" }, { status: 500 })
  }
}