import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosVistorias } from "@/lib/db/schema/ativos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select()
      .from(ativosVistorias)
      .where(eq(ativosVistorias.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/ativos/vistorias/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(ativosVistorias)
      .where(eq(ativosVistorias.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(ativosVistorias)
      .set({
        status: body.status !== undefined ? body.status : existente.status,
        dataProgramada: body.dataProgramada !== undefined ? body.dataProgramada : existente.dataProgramada,
        executadoPorId: body.executadoPorId !== undefined ? body.executadoPorId : existente.executadoPorId,
        observacoes: body.observacoes !== undefined ? body.observacoes : existente.observacoes,
        updatedAt: new Date(),
      })
      .where(eq(ativosVistorias.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Vistoria #${id} atualizada`,
      entidade: "AtivoVistoria",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/ativos/vistorias/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    const [existente] = await db
      .select()
      .from(ativosVistorias)
      .where(eq(ativosVistorias.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 })
    }

    await db.delete(ativosVistorias).where(eq(ativosVistorias.id, parseInt(id)))

    await notificarDelecao("Vistoria", `Vistoria #${existente.id}`, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/ativos/vistorias/[id]")
  }
}