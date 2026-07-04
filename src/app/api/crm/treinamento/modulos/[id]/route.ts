import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTreinoModulos } from "@/lib/db/schema/crm-treino-modulos"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const id = parseInt(params.id)

    const [atualizado] = await db
      .update(crmTreinoModulos)
      .set({
        titulo: body.titulo,
        descricao: body.descricao,
        icone: body.icone,
        cor: body.cor,
        ordem: body.ordem,
        ativo: body.ativo,
      })
      .where(eq(crmTreinoModulos.id, id))
      .returning()

    if (!atualizado) {
      return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 })
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "atualizar",
      descricao: `Módulo de treinamento atualizado: ${body.titulo}`,
      entidade: "CrmTreinoModulo",
      entidadeId: id,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/crm/treinamento/modulos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)

    const [deletado] = await db
      .delete(crmTreinoModulos)
      .where(eq(crmTreinoModulos.id, id))
      .returning()

    if (!deletado) {
      return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 })
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "deletar",
      descricao: `Módulo de treinamento deletado: ${deletado.titulo}`,
      entidade: "CrmTreinoModulo",
      entidadeId: id,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/treinamento/modulos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
