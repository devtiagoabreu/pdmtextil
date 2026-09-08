import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procSubprocessos } from "@/lib/db/schema/processos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procSubprocessoSchema } from "@/lib/validation"

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
      .from(procSubprocessos)
      .where(eq(procSubprocessos.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Subprocesso não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/processos/subprocessos/[id]]", error)
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
    const parsed = validateRequest(procSubprocessoSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(procSubprocessos)
      .where(eq(procSubprocessos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Subprocesso não encontrado" }, { status: 404 })
    }

    const [atualizado] = await db
      .update(procSubprocessos)
      .set({
        processoId: parsed.data.processoId,
        nome: parsed.data.nome,
        descricao: parsed.data.descricao || null,
        ordem: parsed.data.ordem !== undefined ? parsed.data.ordem : existente.ordem,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(procSubprocessos.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Subprocesso #${id} atualizado`,
      entidade: "ProcSubprocesso",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/processos/subprocessos/[id]")
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
      .from(procSubprocessos)
      .where(eq(procSubprocessos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Subprocesso não encontrado" }, { status: 404 })
    }

    await db.delete(procSubprocessos).where(eq(procSubprocessos.id, parseInt(id)))

    await notificarDelecao("Subprocesso", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/processos/subprocessos/[id]")
  }
}