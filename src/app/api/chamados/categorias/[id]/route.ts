import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chamadoCategorias, tickets } from "@/lib/db/schema/chamados"
import { eq, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoCategoriaUpdateSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select()
      .from(chamadoCategorias)
      .where(eq(chamadoCategorias.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/chamados/categorias/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const [existente] = await db
      .select()
      .from(chamadoCategorias)
      .where(eq(chamadoCategorias.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = validateRequest(chamadoCategoriaUpdateSchema, body)
    if ("error" in parsed) return parsed.error

    const codigo = parsed.data.codigo ?? existente.codigo

    const [atualizada] = await db
      .update(chamadoCategorias)
      .set({
        ...(parsed.data.codigo !== undefined ? { codigo } : {}),
        ...(parsed.data.nome !== undefined ? { nome: parsed.data.nome } : {}),
        ...(parsed.data.cor !== undefined ? { cor: parsed.data.cor } : {}),
        ...(parsed.data.ativo !== undefined ? { ativo: parsed.data.ativo } : {}),
        ...(parsed.data.ordem !== undefined ? { ordem: parsed.data.ordem } : {}),
        updatedAt: new Date(),
      })
      .where(eq(chamadoCategorias.id, parseInt(id)))
      .returning()

    if (codigo !== existente.codigo) {
      await db
        .update(tickets)
        .set({ categoria: codigo, updatedAt: new Date() })
        .where(eq(tickets.categoria, existente.codigo))
    }

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Categoria de chamado #${id} atualizada: ${atualizada.nome}`,
      entidade: "ChamadoCategoria",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/chamados/categorias/[id]")
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
      .from(chamadoCategorias)
      .where(eq(chamadoCategorias.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.categoria, existente.codigo))

    if (total > 0) {
      return NextResponse.json(
        {
          error: `Não pode ser excluída pois possui ${total} chamado(s) vinculado(s). Desative-a ou renomeie o código.`,
          fkError: true,
        },
        { status: 409 }
      )
    }

    await db.delete(chamadoCategorias).where(eq(chamadoCategorias.id, parseInt(id)))

    await registrarLog({
      tipo: "EXCLUSAO",
      acao: "excluir",
      descricao: `Categoria de chamado excluída: ${existente.nome}`,
      entidade: "ChamadoCategoria",
      entidadeId: existente.id,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/chamados/categorias/[id]")
  }
}
