import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosTiposVistoria, ativoCategorias } from "@/lib/db/schema/ativos"
import { procAreas } from "@/lib/db/schema/processos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoTipoVistoriaSchema } from "@/lib/validation"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select({
        id: ativosTiposVistoria.id,
        nome: ativosTiposVistoria.nome,
        categoriaId: ativosTiposVistoria.categoriaId,
        categoriaNome: ativoCategorias.nome,
        areaId: ativosTiposVistoria.areaId,
        areaNome: procAreas.nome,
        procedimento: ativosTiposVistoria.procedimento,
        checklist: ativosTiposVistoria.checklist,
        periodicidade: ativosTiposVistoria.periodicidade,
        diasIntervalo: ativosTiposVistoria.diasIntervalo,
        baseLegal: ativosTiposVistoria.baseLegal,
        ativo: ativosTiposVistoria.ativo,
        createdAt: ativosTiposVistoria.createdAt,
        updatedAt: ativosTiposVistoria.updatedAt,
      })
      .from(ativosTiposVistoria)
      .leftJoin(ativoCategorias, eq(ativosTiposVistoria.categoriaId, ativoCategorias.id))
      .leftJoin(procAreas, eq(ativosTiposVistoria.areaId, procAreas.id))
      .where(eq(ativosTiposVistoria.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Tipo de vistoria não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/ativos/tipos-vistoria/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(ativoTipoVistoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(ativosTiposVistoria)
      .where(eq(ativosTiposVistoria.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Tipo de vistoria não encontrado" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(ativosTiposVistoria)
      .set({
        nome: parsed.data.nome,
        categoriaId: parsed.data.categoriaId || null,
        areaId: parsed.data.areaId,
        procedimento: parsed.data.procedimento || null,
        checklist: parsed.data.checklist,
        periodicidade: parsed.data.periodicidade,
        diasIntervalo: parsed.data.diasIntervalo || null,
        baseLegal: parsed.data.baseLegal || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(ativosTiposVistoria.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Tipo de vistoria #${id} atualizado`,
      entidade: "AtivoTipoVistoria",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/ativos/tipos-vistoria/[id]")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    const [existente] = await db
      .select()
      .from(ativosTiposVistoria)
      .where(eq(ativosTiposVistoria.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Tipo de vistoria não encontrado" }, { status: 404 })
    }

    await db.delete(ativosTiposVistoria).where(eq(ativosTiposVistoria.id, parseInt(id)))

    await notificarDelecao("Tipo de vistoria", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/ativos/tipos-vistoria/[id]")
  }
}
