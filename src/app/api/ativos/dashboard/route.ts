import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativos, ativoCategorias, ativosPlanosVistoria, ativosVistorias, ativosTiposVistoria } from "@/lib/db/schema/ativos"
import { count, eq, and, gte, lte, notInArray, inArray, asc } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const hoje = new Date().toISOString().slice(0, 10)
    const primeiroDia = new Date().toISOString().slice(0, 8) + "01"

    const [rAtivos] = await db.select({ n: count() }).from(ativos).where(eq(ativos.ativo, true))
    const [rCategorias] = await db.select({ n: count() }).from(ativoCategorias)
    const [rPlanos] = await db.select({ n: count() }).from(ativosPlanosVistoria)
    const [rVistoriasMes] = await db
      .select({ n: count() })
      .from(ativosVistorias)
      .where(
        and(
          gte(ativosVistorias.dataRealizada, primeiroDia),
          lte(ativosVistorias.dataRealizada, hoje),
        ),
      )
    const [rPendentes] = await db
      .select({ n: count() })
      .from(ativosVistorias)
      .where(eq(ativosVistorias.status, "PENDENTE"))
    const [rAtrasadas] = await db
      .select({ n: count() })
      .from(ativosVistorias)
      .where(
        and(
          lte(ativosVistorias.dataProgramada, hoje),
          notInArray(ativosVistorias.status, ["CONCLUIDA", "CANCELADA"]),
        ),
      )

    const proximas = await db
      .select({
        id: ativosVistorias.id,
        planoId: ativosVistorias.planoId,
        ativoId: ativosVistorias.ativoId,
        ativoNome: ativos.nome,
        ativoCodigo: ativos.codigo,
        tipoVistoriaId: ativosVistorias.tipoVistoriaId,
        tipoVistoriaNome: ativosTiposVistoria.nome,
        status: ativosVistorias.status,
        dataProgramada: ativosVistorias.dataProgramada,
      })
      .from(ativosVistorias)
      .leftJoin(ativos, eq(ativosVistorias.ativoId, ativos.id))
      .leftJoin(ativosTiposVistoria, eq(ativosVistorias.tipoVistoriaId, ativosTiposVistoria.id))
      .where(
        and(
          inArray(ativosVistorias.status, ["PENDENTE", "EM_ANDAMENTO"]),
          gte(ativosVistorias.dataProgramada, hoje),
        ),
      )
      .orderBy(asc(ativosVistorias.dataProgramada))
      .limit(10)

    const setores: { setor: string }[] = await db
      .select({ setor: ativosTiposVistoria.setor })
      .from(ativosTiposVistoria)

    const vistoriasSetor: { setor: string; resultado: string | null }[] = await db
      .select({
        setor: ativosTiposVistoria.setor,
        resultado: ativosVistorias.resultado,
      })
      .from(ativosVistorias)
      .leftJoin(ativosTiposVistoria, eq(ativosVistorias.tipoVistoriaId, ativosTiposVistoria.id))

    const compliancePorSetor = [...new Set(setores.map((s) => s.setor))]
      .map((setor) => {
        const doSetor: { setor: string; resultado: string | null }[] = vistoriasSetor.filter((v) => v.setor === setor)
        const total = doSetor.length
        const conformes = doSetor.filter((v) => v.resultado === "CONFORME").length
        return {
          setor,
          total,
          conformes,
          percentual: total > 0 ? Math.round((conformes / total) * 100) : 0,
        }
      })
      .filter((r) => r.total > 0)

    return NextResponse.json({
      totais: {
        ativos: rAtivos.n,
        categorias: rCategorias.n,
        planos: rPlanos.n,
        vistoriasMes: rVistoriasMes.n,
        pendentes: rPendentes.n,
        atrasadas: rAtrasadas.n,
      },
      proximas,
      compliancePorSetor,
    })
  } catch (error) {
    console.error("[GET /api/ativos/dashboard]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}