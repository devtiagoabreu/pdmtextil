import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procTreinoLicoes } from "@/lib/db/schema/proc-treino-licoes"
import { procTreinoModulos } from "@/lib/db/schema/proc-treino-modulos"
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
        id: procTreinoLicoes.id,
        moduloId: procTreinoLicoes.moduloId,
        moduloTitulo: procTreinoModulos.titulo,
        moduloCor: procTreinoModulos.cor,
        moduloIcone: procTreinoModulos.icone,
        titulo: procTreinoLicoes.titulo,
        conteudoMd: procTreinoLicoes.conteudoMd,
        preRequisitos: procTreinoLicoes.preRequisitos,
        linksPop: procTreinoLicoes.linksPop,
        linksVideo: procTreinoLicoes.linksVideo,
        pathnameRelacionado: procTreinoLicoes.pathnameRelacionado,
        ordem: procTreinoLicoes.ordem,
        ativo: procTreinoLicoes.ativo,
        createdAt: procTreinoLicoes.createdAt,
        updatedAt: procTreinoLicoes.updatedAt,
      })
      .from(procTreinoLicoes)
      .leftJoin(procTreinoModulos, eq(procTreinoLicoes.moduloId, procTreinoModulos.id))
      .where(eq(procTreinoLicoes.id, parseInt(id)))

    if (!licao) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    return NextResponse.json(licao)
  } catch (error) {
    console.error("[GET /api/processos/treinamento]", error)
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
      .update(procTreinoLicoes)
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
      .where(eq(procTreinoLicoes.id, idNum))
      .returning()

    if (!atualizada) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "atualizar",
      descricao: `Lição de treinamento atualizada: ${body.titulo}`,
      entidade: "ProcTreinoLicao",
      entidadeId: idNum,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PUT /api/processos/treinamento]", error)
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
      .delete(procTreinoLicoes)
      .where(eq(procTreinoLicoes.id, idNum))
      .returning()

    if (!deletada) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "deletar",
      descricao: `Lição de treinamento deletada: ${deletada.titulo}`,
      entidade: "ProcTreinoLicao",
      entidadeId: idNum,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/processos/treinamento]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}