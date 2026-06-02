import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruComposicao } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const lista = await db.select().from(produtoCruComposicao).where(eq(produtoCruComposicao.produtoCruId, id))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]/composicao]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const body = await req.json()

    const novo = await db
      .insert(produtoCruComposicao)
      .values({
        produtoCruId: id,
        material: body.material,
        percentual: body.percentual,
      })
      .returning()

    return NextResponse.json(novo[0])
  } catch (error: any) {
    console.error("[POST /api/cadastros/produto-cru/[id]/composicao]", error)
    return NextResponse.json({ error: "Erro ao adicionar composição", detalhe: error?.message || String(error) }, { status: 500 })
  }
}
