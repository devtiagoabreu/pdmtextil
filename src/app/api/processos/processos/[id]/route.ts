import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procProcessos } from "@/lib/db/schema/processos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procProcessoSchema } from "@/lib/validation"

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
      .from(procProcessos)
      .where(eq(procProcessos.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/processos/processos/[id]]", error)
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
    const parsed = validateRequest(procProcessoSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(procProcessos)
      .where(eq(procProcessos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 })
    }

    const [atualizado] = await db
      .update(procProcessos)
      .set({
        areaId: parsed.data.areaId,
        codigo: parsed.data.codigo || null,
        nome: parsed.data.nome,
        objetivo: parsed.data.objetivo || null,
        responsavel: parsed.data.responsavel || null,
        status: parsed.data.status ?? existente.status,
        versao: parsed.data.versao !== undefined ? parsed.data.versao : existente.versao,
        entradas: parsed.data.entradas !== undefined ? parsed.data.entradas : existente.entradas,
        saidas: parsed.data.saidas !== undefined ? parsed.data.saidas : existente.saidas,
        fornecedores: parsed.data.fornecedores !== undefined ? parsed.data.fornecedores : existente.fornecedores,
        clientes: parsed.data.clientes !== undefined ? parsed.data.clientes : existente.clientes,
        recursos: parsed.data.recursos !== undefined ? parsed.data.recursos : existente.recursos,
        sistemas: parsed.data.sistemas !== undefined ? parsed.data.sistemas : existente.sistemas,
        equipamentos: parsed.data.equipamentos !== undefined ? parsed.data.equipamentos : existente.equipamentos,
        indicadores: parsed.data.indicadores !== undefined ? parsed.data.indicadores : existente.indicadores,
        riscos: parsed.data.riscos !== undefined ? parsed.data.riscos : existente.riscos,
        controles: parsed.data.controles !== undefined ? parsed.data.controles : existente.controles,
        observacoes: parsed.data.observacoes || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(procProcessos.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Processo #${id} atualizado`,
      entidade: "ProcProcesso",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/processos/processos/[id]")
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
      .from(procProcessos)
      .where(eq(procProcessos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 })
    }

    await db.delete(procProcessos).where(eq(procProcessos.id, parseInt(id)))

    await notificarDelecao("Processo", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/processos/processos/[id]")
  }
}