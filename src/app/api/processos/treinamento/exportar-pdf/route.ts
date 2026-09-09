import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procTreinoModulos } from "@/lib/db/schema/proc-treino-modulos"
import { procTreinoLicoes } from "@/lib/db/schema/proc-treino-licoes"
import { eq, asc, sql } from "drizzle-orm"

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
        licoes: sql<any[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${procTreinoLicoes.id},
                'titulo', ${procTreinoLicoes.titulo},
                'conteudoMd', ${procTreinoLicoes.conteudoMd},
                'preRequisitos', ${procTreinoLicoes.preRequisitos},
                'ordem', ${procTreinoLicoes.ordem},
                'ativo', ${procTreinoLicoes.ativo}
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
    console.error("[GET /api/processos/treinamento/exportar-pdf]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}