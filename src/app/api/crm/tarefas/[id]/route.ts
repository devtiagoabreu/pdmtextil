import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [tarefa] = await db
      .select()
      .from(crmTarefas)
      .where(eq(crmTarefas.id, parseInt(id)))
      .limit(1)

    if (!tarefa) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    return handleApiError(error, "GET /api/crm/tarefas/[id]")
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
      .from(crmTarefas)
      .where(eq(crmTarefas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.titulo !== undefined) values.titulo = body.titulo
    if (body.descricao !== undefined) values.descricao = body.descricao
    if (body.tipo !== undefined) values.tipo = body.tipo
    if (body.dataPrevista !== undefined) values.dataPrevista = body.dataPrevista
    if (body.dataConclusao !== undefined) values.dataConclusao = body.dataConclusao
    if (body.status !== undefined) values.status = body.status
    if (body.responsavelId !== undefined) values.responsavelId = body.responsavelId
    if (body.empresaId !== undefined) values.empresaId = body.empresaId
    if (body.oportunidadeId !== undefined) values.oportunidadeId = body.oportunidadeId

    if (body.status === "CONCLUIDO") {
      values.dataConclusao = new Date().toISOString().split("T")[0]
    }

    const [atualizada] = await db
      .update(crmTarefas)
      .set(values)
      .where(eq(crmTarefas.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Tarefa #${id} atualizada`,
      entidade: "CrmTarefa",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    if (body.status && body.status !== existente.status && existente.empresaId) {
      await inserirTimelineEvento({
        empresaId: existente.empresaId,
        tipo: "TAREFA",
        descricao: `Tarefa "${existente.titulo}" ${body.status === "CONCLUIDO" ? "concluída" : "reaberta"}`,
        metadados: { tarefaId: atualizada.id, statusAnterior: existente.status, statusNovo: body.status },
      })
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/tarefas/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.session.user.role !== "ADMIN" && auth.session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmTarefas).where(eq(crmTarefas.id, parseInt(id)))

    await notificarDelecao("Tarefa CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/tarefas/[id]")
  }
}
