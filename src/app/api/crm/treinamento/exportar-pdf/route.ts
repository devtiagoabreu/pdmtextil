import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTreinoModulos } from "@/lib/db/schema/crm-treino-modulos"
import { crmTreinoLicoes } from "@/lib/db/schema/crm-treino-licoes"
import { eq, asc, sql } from "drizzle-orm"

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
        licoes: sql<any[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${crmTreinoLicoes.id},
                'titulo', ${crmTreinoLicoes.titulo},
                'conteudoMd', ${crmTreinoLicoes.conteudoMd},
                'preRequisitos', ${crmTreinoLicoes.preRequisitos},
                'ordem', ${crmTreinoLicoes.ordem},
                'ativo', ${crmTreinoLicoes.ativo}
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
    console.error("[GET /api/crm/treinamento/exportar-pdf]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
