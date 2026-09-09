import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procTreinoModulos } from "@/lib/db/schema/proc-treino-modulos"
import { procTreinoLicoes } from "@/lib/db/schema/proc-treino-licoes"
import { eq, asc, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const modulos = await db
      .select({
        id: procTreinoModulos.id,
        titulo: procTreinoModulos.titulo,
        descricao: procTreinoModulos.descricao,
        icone: procTreinoModulos.icone,
        cor: procTreinoModulos.cor,
        ordem: procTreinoModulos.ordem,
        ativo: procTreinoModulos.ativo,
        createdAt: procTreinoModulos.createdAt,
        licoes: sql<any[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${procTreinoLicoes.id},
                'titulo', ${procTreinoLicoes.titulo},
                'ordem', ${procTreinoLicoes.ordem},
                'ativo', ${procTreinoLicoes.ativo},
                'pathnameRelacionado', ${procTreinoLicoes.pathnameRelacionado}
              )
              ORDER BY ${procTreinoLicoes.ordem} ASC
            ) FILTER (WHERE ${procTreinoLicoes.id} IS NOT NULL),
            '[]'
          )
        `,
      })
      .from(procTreinoModulos)
      .leftJoin(procTreinoLicoes, eq(procTreinoLicoes.moduloId, procTreinoModulos.id))
      .groupBy(procTreinoModulos.id)
      .orderBy(asc(procTreinoModulos.ordem))

    return NextResponse.json(modulos)
  } catch (error) {
    console.error("[GET /api/processos/treinamento]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { moduloId, titulo, conteudoMd, preRequisitos, linksPop, linksVideo, pathnameRelacionado, ordem } = body

    if (!moduloId || !titulo) {
      return NextResponse.json({ error: "moduloId e titulo são obrigatórios" }, { status: 400 })
    }

    const [nova] = await db
      .insert(procTreinoLicoes)
      .values({
        moduloId,
        titulo,
        conteudoMd: conteudoMd || "",
        preRequisitos: preRequisitos || null,
        linksPop: linksPop || [],
        linksVideo: linksVideo || [],
        pathnameRelacionado: pathnameRelacionado || null,
        ordem: ordem || 0,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Lição de treinamento criada: ${titulo}`,
      entidade: "ProcTreinoLicao",
      entidadeId: nova.id,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/processos/treinamento]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}