import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { basesUrdume, baseUrdumeFios } from "@/lib/db/schema/bases-urdume"
import { fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const base = await db.select().from(basesUrdume).where(eq(basesUrdume.id, id)).limit(1)

    if (!base[0]) {
      return NextResponse.json({ error: "Base não encontrada" }, { status: 404 })
    }

    const fiosLista = await db
      .select({
        id: baseUrdumeFios.id,
        fioId: baseUrdumeFios.fioId,
        fioNome: fios.nome,
        fioCodigo: fios.codigoFio,
        fioIdIntegracao: fios.idIntegracao,
      })
      .from(baseUrdumeFios)
      .leftJoin(fios, eq(baseUrdumeFios.fioId, fios.id))
      .where(eq(baseUrdumeFios.baseUrdumeId, id))
      .orderBy(baseUrdumeFios.id)

    return NextResponse.json({ ...base[0], fiosLista })
  } catch (error) {
    console.error("[GET /api/cadastros/bases-urdume/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const body = await req.json()

    if (body.idIntegracao) {
      const existenteIdInt = await db
        .select()
        .from(basesUrdume)
        .where(eq(basesUrdume.idIntegracao, body.idIntegracao))
        .limit(1)

      if (existenteIdInt[0] && existenteIdInt[0].id !== id) {
        return NextResponse.json({ error: "ID Integração já cadastrado em outra base" }, { status: 409 })
      }
    }

    const baseAtualizada = await db
      .update(basesUrdume)
      .set({
        codigoBase: body.codigoBase,
        codigoCompleto: body.codigoCompleto,
        nome: body.nome,
        descricao: body.descricao || null,
        densidade: body.densidade || null,
        tratamento: body.tratamento || null,
        tensaoUrdume: body.tensaoUrdume || null,
        largura: body.largura || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo ?? true,
        idIntegracao: body.idIntegracao || null,
        updatedAt: new Date(),
      })
      .where(eq(basesUrdume.id, id))
      .returning()

    if (!baseAtualizada[0]) {
      return NextResponse.json({ error: "Base não encontrada" }, { status: 404 })
    }

    if (body.fiosLista && Array.isArray(body.fiosLista)) {
      await db.delete(baseUrdumeFios).where(eq(baseUrdumeFios.baseUrdumeId, id))
      for (const fio of body.fiosLista) {
        await db.insert(baseUrdumeFios).values({
          baseUrdumeId: id,
          fioId: fio.fioId,
        })
      }
    }

    return NextResponse.json(baseAtualizada[0])
  } catch (error: any) {
    console.error("[PUT /api/cadastros/bases-urdume/[id]]", error?.message || error)
    return NextResponse.json({ error: `Erro ao atualizar base: ${error?.message || error}` }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    await db.delete(basesUrdume).where(eq(basesUrdume.id, id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[DELETE /api/cadastros/bases-urdume/[id]]", error?.message || error)
    return NextResponse.json({ error: `Erro ao excluir base: ${error?.message || error}` }, { status: 500 })
  }
}