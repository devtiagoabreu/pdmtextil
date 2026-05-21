import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; asid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid, asid } = await params
    const body = await req.json()

    const isAprovacao = body.status === "APROVADO" || body.status === "REPROVADO"

    if (isAprovacao && session.user.role !== "COMERCIAL" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas COMERCIAL e ADMIN podem aprovar/reprovar amostras" }, { status: 403 })
    }

    if (isAprovacao && !body.motivoAprovacao?.trim()) {
      return NextResponse.json({ error: "Motivo é obrigatório para aprovar ou reprovar" }, { status: 400 })
    }

    const atualizado = await db
      .update(produtoCruAcabamentoAmostra)
      .set({
        descricao: body.descricao,
        status: body.status,
        motivoAprovacao: isAprovacao ? body.motivoAprovacao : body.motivoAprovacao || null,
        observacoes: body.observacoes || null,
        links: body.links || [],
      })
      .where(
        and(
          eq(produtoCruAcabamentoAmostra.id, parseInt(asid)),
          eq(produtoCruAcabamentoAmostra.acabamentoId, parseInt(aid))
        )
      )
      .returning()

    if (atualizado[0]) {
      if (isAprovacao) {
        notificar(
          body.status === "APROVADO" ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
          `Amostra de acabamento #${asid} (acabamento #${aid}) do produto cru #${id} foi ${body.status === "APROVADO" ? "aprovada" : "reprovada"} por ${session.user.name}${body.motivoAprovacao ? ` — Motivo: ${body.motivoAprovacao}` : ""}`,
          `/cadastros/produto-cru/${id}`,
          session.user.name
        )
      } else {
        notificar(
          "AMOSTRA_ATUALIZADA",
          `Amostra de acabamento #${asid} (acabamento #${aid}) do produto cru #${id} foi editada por ${session.user.name}`,
          `/cadastros/produto-cru/${id}`,
          session.user.name
        )
      }
    }

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras/[asid]]", error)
    return NextResponse.json({ error: "Erro ao atualizar amostra" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; asid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem excluir amostras" }, { status: 403 })
    }

    const { id, aid, asid } = await params

    notificar(
      "AMOSTRA_EXCLUIDA",
      `Amostra de acabamento #${asid} (acabamento #${aid}) do produto cru #${id} foi excluída por ${session.user.name}`,
      `/cadastros/produto-cru/${id}`,
      session.user.name
    )

    await db
      .delete(produtoCruAcabamentoAmostra)
      .where(
        and(
          eq(produtoCruAcabamentoAmostra.id, parseInt(asid)),
          eq(produtoCruAcabamentoAmostra.acabamentoId, parseInt(aid))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras/[asid]]", error)
    return NextResponse.json({ error: "Erro ao excluir amostra" }, { status: 500 })
  }
}
