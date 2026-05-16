import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamentoReceita } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { aid } = await params
    const lista = await db.select().from(produtoCruAcabamentoReceita).where(eq(produtoCruAcabamentoReceita.acabamentoId, parseInt(aid)))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]/acabamentos/[aid]/receitas]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { aid } = await params
    const body = await req.json()

    const novo = await db
      .insert(produtoCruAcabamentoReceita)
      .values({
        acabamentoId: parseInt(aid),
        tipoReceita: body.tipoReceita,
        parametros: body.parametros || {},
      })
      .returning()

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/produto-cru/[id]/acabamentos/[aid]/receitas]", error)
    return NextResponse.json({ error: "Erro ao adicionar receita" }, { status: 500 })
  }
}
