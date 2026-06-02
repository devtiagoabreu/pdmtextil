import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorte } from "@/lib/db/schema/requisicoes-corte"
import { eq } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"

const STATUS_VALIDOS = [
  "SOLICITADO",
  "PROCESSANDO",
  "ATENDIDO",
]

// PATCH - Mudar status da requisição de corte
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const { status, comentario } = await req.json()

    if (!status || !STATUS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: `Status inválido. Use: ${STATUS_VALIDOS.join(", ")}` }, { status: 400 })
    }

    const [requisicaoAtual] = await db
      .select({
        status: requisicoesCorte.status,
      })
      .from(requisicoesCorte)
      .where(eq(requisicoesCorte.id, id))
      .limit(1)

    if (!requisicaoAtual) {
      return NextResponse.json({ error: "Requisição de corte não encontrada" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(requisicoesCorte)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(requisicoesCorte.id, id))
      .returning()

    await notificar(
      "REQUISICAO_CORTE_STATUS",
      `Requisição de corte #${id} alterada para ${status} por ${session.user.name}${comentario ? ` — ${comentario}` : ""}`,
      `/comercial/requisicoes-corte/${id}`,
      session.user.name
    )

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar_status", descricao: `Requisição de corte #${id} alterada para ${status}`, entidade: "RequisicaoCorte", entidadeId: id, usuarioNome: session.user.name })

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/comercial/requisicoes-corte/[id]/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
