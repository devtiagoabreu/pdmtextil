import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult

    const { id, aid } = await params
    const body = await req.json()

    const isAprovacao = body.status === "APROVADO" || body.status === "REPROVADO"

    if (isAprovacao && !["COMERCIAL", "ADMIN", "SUDO"].includes(session.user.role)) {
      return NextResponse.json({ error: "Apenas COMERCIAL, ADMIN e SUDO podem aprovar/reprovar amostras" }, { status: 403 })
    }

    if (isAprovacao && !body.motivoAprovacao?.trim()) {
      return NextResponse.json({ error: "Motivo é obrigatório para aprovar ou reprovar" }, { status: 400 })
    }

    // Buscar estado atual para pegar o historico existente
    const [atual] = await db
      .select({ status: produtoCruAmostra.status, historico: produtoCruAmostra.historico })
      .from(produtoCruAmostra)
      .where(eq(produtoCruAmostra.id, parseInt(aid)))
      .limit(1)

    const historicoAtual: any[] = (atual?.historico as any[]) || []
    const statusAnterior = atual?.status

    if (body.status && body.status !== statusAnterior) {
      historicoAtual.push({
        data: new Date().toISOString(),
        usuario: session.user.name,
        usuarioId: userIdResult,
        acao: "MUDANCA_STATUS",
        de: statusAnterior,
        para: body.status,
        motivo: isAprovacao ? body.motivoAprovacao : null,
      })
    }

    const atualizado = await db
      .update(produtoCruAmostra)
      .set({
        descricao: body.descricao,
        status: body.status,
        historico: historicoAtual,
        motivoAprovacao: isAprovacao ? body.motivoAprovacao : body.motivoAprovacao || null,
        observacoes: body.observacoes || null,
        links: body.links || [],
      })
      .where(eq(produtoCruAmostra.id, parseInt(aid)))
      .returning()

    if (atualizado[0]) {
      if (isAprovacao) {
        await notificar(
          body.status === "APROVADO" ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
          `Amostra #${aid} do produto cru #${id} foi ${body.status === "APROVADO" ? "aprovada" : "reprovada"} por ${session.user.name}${body.motivoAprovacao ? ` — Motivo: ${body.motivoAprovacao}` : ""}`,
          `/cadastros/produto-cru/${id}`,
          session.user.name
        )
      } else {
        await notificar(
          "AMOSTRA_ATUALIZADA",
          `Amostra #${aid} do produto cru #${id} foi editada por ${session.user.name}`,
          `/cadastros/produto-cru/${id}`,
          session.user.name
        )
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar_status", descricao: `Amostra tecido cru #${aid} alterada para ${body.status}`, entidade: "AmostraTecidoCru", entidadeId: parseInt(aid), usuarioNome: session.user.name })

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
    if (session.user.role !== "ADMIN" && session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir amostras" }, { status: 403 })
    }

    const { id, aid } = await params

    await db
      .delete(produtoCruAmostra)
      .where(
        and(
          eq(produtoCruAmostra.id, parseInt(aid)),
          eq(produtoCruAmostra.produtoCruId, parseInt(id))
        )
      )

    await notificar(
      "AMOSTRA_EXCLUIDA",
      `Amostra #${aid} do produto cru #${id} foi excluída por ${session.user.name}`,
      `/cadastros/produto-cru/${id}`,
      session.user.name
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/cadastros/produto-cru/[id]/amostras/[aid]")
  }
}
