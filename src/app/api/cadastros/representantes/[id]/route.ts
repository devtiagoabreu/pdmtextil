import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { representantes } from "@/lib/db/schema/representantes"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
import { notificarDelecao } from "@/lib/notificar"
export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params

    const [representante] = await db
      .select()
      .from(representantes)
      .where(eq(representantes.id, parseInt(id)))
      .limit(1)

    if (!representante) {
      return NextResponse.json({ error: "Representante não encontrado" }, { status: 404 })
    }

    return NextResponse.json(representante)
  } catch (error) {
    console.error("[GET /api/cadastros/representantes/[id]]", error)
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

    const { id } = await params
    const body = await req.json()

    const { nome, cnpj, razaoSocial, email, telefone, contato, endereco, cidade, uf, gerenteId, idIntegracao, ativo } = body

    const [atualizado] = await db
      .update(representantes)
      .set({
        nome: nome?.trim(),
        cnpj: cnpj?.trim(),
        razaoSocial: razaoSocial?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        contato: contato?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        uf: uf?.trim() || null,
        gerenteId: gerenteId || null,
        idIntegracao: idIntegracao || null,
        ativo: ativo ?? true,
        updatedAt: new Date(),
      })
      .where(eq(representantes.id, parseInt(id)))
      .returning()

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/cadastros/representantes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params

    const deleted = await db
      .delete(representantes)
      .where(eq(representantes.id, parseInt(id)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Representante não encontrado" }, { status: 404 })
    }

    await notificarDelecao("Representante", String(deleted[0]?.nome || id), session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/cadastros/representantes/[id]")
  }
}
