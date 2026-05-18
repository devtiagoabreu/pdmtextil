import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

const ROLES_APROVACAO = ["COMERCIAL", "QUALIDADE", "ADMIN"]

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid } = await params
    const body = await req.json()

    const role = session.user.role as string
    const isAprovacao = body.status === "APROVADO" || body.status === "REPROVADO"

    if (isAprovacao && !ROLES_APROVACAO.includes(role)) {
      return NextResponse.json({ error: "Apenas COMERCIAL, QUALIDADE e ADMIN podem aprovar/reprovar amostras" }, { status: 403 })
    }

    if (isAprovacao && !body.motivoAprovacao?.trim()) {
      return NextResponse.json({ error: "Motivo é obrigatório para aprovar ou reprovar" }, { status: 400 })
    }

    const atualizado = await db
      .update(produtoCruAmostra)
      .set({
        descricao: body.descricao,
        status: body.status,
        motivoAprovacao: isAprovacao ? body.motivoAprovacao : body.motivoAprovacao || null,
        observacoes: body.observacoes || null,
        links: body.links || [],
      })
      .where(eq(produtoCruAmostra.id, parseInt(aid)))
      .returning()

    if (isAprovacao && atualizado[0]) {
      notificar(
        body.status === "APROVADO" ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
        `Amostra #${aid} do produto cru #${id} foi ${body.status === "APROVADO" ? "aprovada" : "reprovada"} por ${session.user.name}${body.motivoAprovacao ? ` — Motivo: ${body.motivoAprovacao}` : ""}`,
        `/cadastros/produto-cru/${id}`,
        session.user.name
      )
    }

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/produto-cru/[id]/amostras/[aid]]", error)
    return NextResponse.json({ error: "Erro ao atualizar amostra" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid } = await params
    await db
      .delete(produtoCruAmostra)
      .where(
        and(
          eq(produtoCruAmostra.id, parseInt(aid)),
          eq(produtoCruAmostra.produtoCruId, parseInt(id))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/amostras/[aid]]", error)
    return NextResponse.json({ error: "Erro ao excluir amostra" }, { status: 500 })
  }
}
