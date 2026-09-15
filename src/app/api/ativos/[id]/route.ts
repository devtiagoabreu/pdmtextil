import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativos, ativoCategorias } from "@/lib/db/schema/ativos"
import { maquinas } from "@/lib/db/schema/maqoper"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoSchema } from "@/lib/validation"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select({
        id: ativos.id,
        codigo: ativos.codigo,
        nome: ativos.nome,
        categoriaId: ativos.categoriaId,
        categoriaNome: ativoCategorias.nome,
        localizacao: ativos.localizacao,
        fabricante: ativos.fabricante,
        modelo: ativos.modelo,
        numSerie: ativos.numSerie,
        anoFabricacao: ativos.anoFabricacao,
        dataAquisicao: ativos.dataAquisicao,
        valorAquisicao: ativos.valorAquisicao,
        valorResidual: ativos.valorResidual,
        vidaUtilAnos: ativos.vidaUtilAnos,
        status: ativos.status,
        maquinaId: ativos.maquinaId,
        maquinaNome: maquinas.nome,
        responsavelId: ativos.responsavelId,
        responsavelNome: usuarios.name,
        observacoes: ativos.observacoes,
        anexos: ativos.anexos,
        ativo: ativos.ativo,
        createdAt: ativos.createdAt,
        updatedAt: ativos.updatedAt,
      })
      .from(ativos)
      .leftJoin(ativoCategorias, eq(ativos.categoriaId, ativoCategorias.id))
      .leftJoin(maquinas, eq(ativos.maquinaId, maquinas.id))
      .leftJoin(usuarios, eq(ativos.responsavelId, usuarios.id))
      .where(eq(ativos.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/ativos/[id]]", error)
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
    const parsed = validateRequest(ativoSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(ativos)
      .where(eq(ativos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(ativos)
      .set({
        codigo: parsed.data.codigo,
        nome: parsed.data.nome,
        categoriaId: parsed.data.categoriaId,
        localizacao: parsed.data.localizacao || null,
        fabricante: parsed.data.fabricante || null,
        modelo: parsed.data.modelo || null,
        numSerie: parsed.data.numSerie || null,
        anoFabricacao: parsed.data.anoFabricacao || null,
        dataAquisicao: parsed.data.dataAquisicao || null,
        valorAquisicao: parsed.data.valorAquisicao || null,
        valorResidual: parsed.data.valorResidual || null,
        vidaUtilAnos: parsed.data.vidaUtilAnos || null,
        status: parsed.data.status || existente.status,
        maquinaId: parsed.data.maquinaId || null,
        responsavelId: parsed.data.responsavelId || null,
        observacoes: parsed.data.observacoes || null,
        anexos: parsed.data.anexos,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(ativos.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Ativo #${id} atualizado`,
      entidade: "Ativo",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/ativos/[id]")
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
      .from(ativos)
      .where(eq(ativos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 })
    }

    await db.delete(ativos).where(eq(ativos.id, parseInt(id)))

    await notificarDelecao("Ativo", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/ativos/[id]")
  }
}