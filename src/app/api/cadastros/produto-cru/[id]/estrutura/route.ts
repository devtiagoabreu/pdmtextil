import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruEstrutura } from "@/lib/db/schema/produto-cru"
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
    const lista = await db.select().from(produtoCruEstrutura).where(eq(produtoCruEstrutura.produtoCruId, id))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]/estrutura]", error)
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
      .insert(produtoCruEstrutura)
      .values({
        produtoCruId: id,
        tipo: body.tipo,
        fioId: body.fioId || null,
        baseUrdumeId: body.baseUrdumeId || null,
        ordem: body.ordem || null,
      })
      .returning()

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/produto-cru/[id]/estrutura]", error)
    return NextResponse.json({ error: "Erro ao adicionar estrutura" }, { status: 500 })
  }
}
