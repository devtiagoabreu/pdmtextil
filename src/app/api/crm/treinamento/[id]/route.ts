import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTreinoLicoes } from "@/lib/db/schema/crm-treino-licoes"
import { crmTreinoModulos } from "@/lib/db/schema/crm-treino-modulos"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const [licao] = await db
      .select({
        id: crmTreinoLicoes.id,
        moduloId: crmTreinoLicoes.moduloId,
        moduloTitulo: crmTreinoModulos.titulo,
        moduloCor: crmTreinoModulos.cor,
        moduloIcone: crmTreinoModulos.icone,
        titulo: crmTreinoLicoes.titulo,
        conteudoMd: crmTreinoLicoes.conteudoMd,
        preRequisitos: crmTreinoLicoes.preRequisitos,
        linksPop: crmTreinoLicoes.linksPop,
        linksVideo: crmTreinoLicoes.linksVideo,
        pathnameRelacionado: crmTreinoLicoes.pathnameRelacionado,
        ordem: crmTreinoLicoes.ordem,
        ativo: crmTreinoLicoes.ativo,
        createdAt: crmTreinoLicoes.createdAt,
        updatedAt: crmTreinoLicoes.updatedAt,
      })
      .from(crmTreinoLicoes)
      .leftJoin(crmTreinoModulos, eq(crmTreinoLicoes.moduloId, crmTreinoModulos.id))
      .where(eq(crmTreinoLicoes.id, parseInt(id)))

    if (!licao) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    return NextResponse.json(licao)
  } catch (error) {
    console.error("[GET /api/crm/treinamento]", error)
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

    const body = await req.json()
    const { id } = await params
    const idNum = parseInt(id)

    const [atualizada] = await db
      .update(crmTreinoLicoes)
      .set({
        moduloId: body.moduloId,
        titulo: body.titulo,
        conteudoMd: body.conteudoMd,
        preRequisitos: body.preRequisitos,
        linksPop: body.linksPop,
        linksVideo: body.linksVideo,
        pathnameRelacionado: body.pathnameRelacionado,
        ordem: body.ordem,
        ativo: body.ativo,
      })
      .where(eq(crmTreinoLicoes.id, idNum))
      .returning()

    if (!atualizada) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "atualizar",
      descricao: `Lição de treinamento atualizada: ${body.titulo}`,
      entidade: "CrmTreinoLicao",
      entidadeId: idNum,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PUT /api/crm/treinamento]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const idNum = parseInt(id)

    const [deletada] = await db
      .delete(crmTreinoLicoes)
      .where(eq(crmTreinoLicoes.id, idNum))
      .returning()

    if (!deletada) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "deletar",
      descricao: `Lição de treinamento deletada: ${deletada.titulo}`,
      entidade: "CrmTreinoLicao",
      entidadeId: idNum,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/treinamento]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
