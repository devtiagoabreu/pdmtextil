import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTreinoModulos } from "@/lib/db/schema/crm-treino-modulos"
import { crmTreinoLicoes } from "@/lib/db/schema/crm-treino-licoes"
import { eq, asc, desc, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const modulos = await db
      .select({
        id: crmTreinoModulos.id,
        titulo: crmTreinoModulos.titulo,
        descricao: crmTreinoModulos.descricao,
        icone: crmTreinoModulos.icone,
        cor: crmTreinoModulos.cor,
        ordem: crmTreinoModulos.ordem,
        ativo: crmTreinoModulos.ativo,
        createdAt: crmTreinoModulos.createdAt,
        licoes: sql<any[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${crmTreinoLicoes.id},
                'titulo', ${crmTreinoLicoes.titulo},
                'ordem', ${crmTreinoLicoes.ordem},
                'ativo', ${crmTreinoLicoes.ativo},
                'pathnameRelacionado', ${crmTreinoLicoes.pathnameRelacionado}
              )
              ORDER BY ${crmTreinoLicoes.ordem} ASC
            ) FILTER (WHERE ${crmTreinoLicoes.id} IS NOT NULL),
            '[]'
          )
        `,
      })
      .from(crmTreinoModulos)
      .leftJoin(crmTreinoLicoes, eq(crmTreinoLicoes.moduloId, crmTreinoModulos.id))
      .groupBy(crmTreinoModulos.id)
      .orderBy(asc(crmTreinoModulos.ordem))

    return NextResponse.json(modulos)
  } catch (error) {
    console.error("[GET /api/crm/treinamento]", error)
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
      .insert(crmTreinoLicoes)
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
      entidade: "CrmTreinoLicao",
      entidadeId: nova.id,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/treinamento]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
