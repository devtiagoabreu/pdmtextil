import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmCampanhas } from "@/lib/db/schema/crm-campanhas"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const [item] = await db
      .select()
      .from(crmCampanhas)
      .where(eq(crmCampanhas.id, Number(params.id)))
      .limit(1)

    if (!item) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })

    return NextResponse.json(item)
  } catch (error) {
    console.error("[GET /api/crm/campanhas/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const [atualizado] = await db
      .update(crmCampanhas)
      .set({
        nome: body.nome,
        tipo: body.tipo,
        descricao: body.descricao,
        dataInicio: body.dataInicio,
        dataFim: body.dataFim,
        orcamento: body.orcamento,
        leadsGerados: body.leadsGerados,
        custoAquisicao: body.custoAquisicao,
        status: body.status,
      })
      .where(eq(crmCampanhas.id, Number(params.id)))
      .returning()

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/crm/campanhas/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    await db.delete(crmCampanhas).where(eq(crmCampanhas.id, Number(params.id)))

    return NextResponse.json({ message: "Campanha excluída" })
  } catch (error) {
    console.error("[DELETE /api/crm/campanhas/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
