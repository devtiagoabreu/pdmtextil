import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq } from "drizzle-orm"
import { notificar } from "@/lib/notificar"
import { getValidStatuses } from "@/lib/status-utils"

// PATCH - Mudar status da solicitação
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const { status, comentario } = await req.json()

    const validStatuses = await getValidStatuses("SOLICITACAO_DESENVOLVIMENTO")
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Status inválido. Use: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    const [solicitacaoAtual] = await db
      .select({
        status: solicitacoes.status,
        historicoComunicacao: solicitacoes.historicoComunicacao,
      })
      .from(solicitacoes)
      .where(eq(solicitacoes.id, id))
      .limit(1)

    if (!solicitacaoAtual) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const historico = (solicitacaoAtual.historicoComunicacao as any[]) || []
    historico.push({
      data: new Date().toISOString(),
      usuario: session.user.name,
      usuarioId: userIdResult,
      acao: "MUDANCA_STATUS",
      de: solicitacaoAtual.status,
      para: status,
      mensagem: comentario || `Status alterado para ${status}`,
    })

    const updateData: any = {
      status,
      historicoComunicacao: historico,
      updatedAt: new Date(),
    }

    if (status === "CONCLUIDO" || status === "CONCLUIDO_DEV") {
      updateData.dataConclusao = new Date()
    }

    const [atualizada] = await db
      .update(solicitacoes)
      .set(updateData)
      .where(eq(solicitacoes.id, id))
      .returning()

    if (status === "APROVADO_CLI") {
      await notificar(
        "SOLICITACAO_APROVADA",
        `Solicitação #${id} foi aprovada pelo cliente por ${session.user.name}${comentario ? ` — ${comentario}` : ""}`,
        `/comercial/solicitacoes/${id}`,
        session.user.name
      )
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/solicitacoes/[id]/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
