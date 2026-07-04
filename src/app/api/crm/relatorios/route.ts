import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmCampanhas } from "@/lib/db/schema/crm-campanhas"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql, gte, lte, count, sum } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const [
      totalEmpresas,
      totalLeads,
      leadsPorOrigem,
      oportunidadesPorStatus,
      oportunidadesPorResponsavel,
      visitasTotal,
      tarefasPorStatus,
      propostasPorStatus,
      campanhasTotal,
    ] = await Promise.all([
      db.select({ total: count() }).from(crmEmpresas),
      db.select({ total: count() }).from(crmLeads),
      db
        .select({ origem: crmLeads.origem, total: count() })
        .from(crmLeads)
        .groupBy(crmLeads.origem)
        .orderBy(desc(count())),
      db
        .select({ status: crmOportunidades.status, total: count(), valor: sql<string>`COALESCE(SUM(${crmOportunidades.valorEstimado}), 0)` })
        .from(crmOportunidades)
        .groupBy(crmOportunidades.status),
      db
        .select({
          nome: usuarios.name,
          total: count(),
          valor: sql<string>`COALESCE(SUM(${crmOportunidades.valorEstimado}), 0)`,
        })
        .from(crmOportunidades)
        .leftJoin(usuarios, eq(crmOportunidades.responsavelId, usuarios.id))
        .groupBy(usuarios.name),
      db.select({ total: count() }).from(crmVisitas),
      db
        .select({ status: crmTarefas.status, total: count() })
        .from(crmTarefas)
        .groupBy(crmTarefas.status),
      db
        .select({ status: crmPropostas.status, total: count() })
        .from(crmPropostas)
        .groupBy(crmPropostas.status),
      db.select({ total: count() }).from(crmCampanhas),
    ])

    const getCount = (rows: { total: number }[]) => Number(rows[0]?.total ?? 0)
    const totalOportunidades = getCount(await db.select({ total: count() }).from(crmOportunidades))
    const ganhas = getCount(await db.select({ total: count() }).from(crmOportunidades).where(eq(crmOportunidades.status, "FECHADO_GANHO")))
    const perdidas = getCount(await db.select({ total: count() }).from(crmOportunidades).where(eq(crmOportunidades.status, "FECHADO_PERDIDO")))

    return NextResponse.json({
      totalEmpresas: getCount(totalEmpresas),
      totalLeads: getCount(totalLeads),
      totalOportunidades,
      totalVisitas: getCount(visitasTotal),
      totalCampanhas: getCount(campanhasTotal),
      leadsPorOrigem: leadsPorOrigem.map((r) => ({ origem: r.origem, total: Number(r.total) })),
      oportunidadesPorStatus: oportunidadesPorStatus.map((r) => ({
        status: r.status,
        total: Number(r.total),
        valor: Number(r.valor),
      })),
      oportunidadesPorResponsavel: oportunidadesPorResponsavel
        .filter((r) => r.nome)
        .map((r) => ({
          nome: r.nome!,
          total: Number(r.total),
          valor: Number(r.valor),
        })),
      tarefasPorStatus: tarefasPorStatus.map((r) => ({ status: r.status, total: Number(r.total) })),
      propostasPorStatus: propostasPorStatus.map((r) => ({ status: r.status, total: Number(r.total) })),
      taxaConversao: {
        ganhas,
        perdidas,
        total: totalOportunidades,
        taxa: totalOportunidades > 0 ? Number(((ganhas / totalOportunidades) * 100).toFixed(1)) : 0,
      },
    })
  } catch (error) {
    console.error("[GET /api/crm/relatorios]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
