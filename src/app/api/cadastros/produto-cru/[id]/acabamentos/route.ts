import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamento } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const lista = await db.select().from(produtoCruAcabamento).where(eq(produtoCruAcabamento.produtoCruId, id))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]/acabamentos]", error)
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
      .insert(produtoCruAcabamento)
      .values({
        produtoCruId: id,
        tipoAcabamento: body.tipoAcabamento,
        descricao: body.descricao || null,
        idIntegracaoErpAcabado: body.idIntegracaoErpAcabado || null,
        possuiReceita: body.possuiReceita ?? false,
      })
      .returning()

    notificar(
      "ACABAMENTO_CRIADO",
      `Novo acabamento #${novo[0].id} adicionado ao produto cru #${id} por ${session.user.name}${body.descricao ? ` — ${body.descricao}` : ""}`,
      `/cadastros/produto-cru/${id}`,
      session.user.name
    )

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/produto-cru/[id]/acabamentos]", error)
    return NextResponse.json({ error: "Erro ao adicionar acabamento" }, { status: 500 })
  }
}
