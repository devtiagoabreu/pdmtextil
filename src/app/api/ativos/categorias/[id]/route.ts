import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativoCategorias } from "@/lib/db/schema/ativos"
import { procAreas } from "@/lib/db/schema/processos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoCategoriaSchema } from "@/lib/validation"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select({
        id: ativoCategorias.id,
        nome: ativoCategorias.nome,
        areaId: ativoCategorias.areaId,
        areaNome: procAreas.nome,
        descricao: ativoCategorias.descricao,
        cor: ativoCategorias.cor,
        icone: ativoCategorias.icone,
        ativo: ativoCategorias.ativo,
        createdAt: ativoCategorias.createdAt,
        updatedAt: ativoCategorias.updatedAt,
      })
      .from(ativoCategorias)
      .leftJoin(procAreas, eq(ativoCategorias.areaId, procAreas.id))
      .where(eq(ativoCategorias.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/ativos/categorias/[id]]", error)
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
    const parsed = validateRequest(ativoCategoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(ativoCategorias)
      .where(eq(ativoCategorias.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(ativoCategorias)
      .set({
        nome: parsed.data.nome,
        areaId: parsed.data.areaId,
        descricao: parsed.data.descricao || null,
        cor: parsed.data.cor || null,
        icone: parsed.data.icone || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(ativoCategorias.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Categoria #${id} atualizada`,
      entidade: "AtivoCategoria",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/ativos/categorias/[id]")
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
      .from(ativoCategorias)
      .where(eq(ativoCategorias.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    await db.delete(ativoCategorias).where(eq(ativoCategorias.id, parseInt(id)))

    await notificarDelecao("Categoria", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/ativos/categorias/[id]")
  }
}
