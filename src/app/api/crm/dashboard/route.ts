import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmTimelineEventos } from "@/lib/db/schema/crm-timeline-eventos"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmPrevisaoVendas } from "@/lib/db/schema/crm-previsao-vendas"
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const now = new Date()
    const hoje = now.toISOString().split("T")[0]
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const [
      leadsTotal,
      leadsMes,
      empresasTotal,
      oportunidadesTotal,
      oportunidadesByStatus,
      oportunidadesMes,
      propostasTotal,
      propostasByStatus,
      visitasTotal,
      visitasHoje,
      tarefasPendentes,
      tarefasVencendo,
      topEmpresasRaw,
      forecastRaw,
      recentesRaw,
      previsaoVendasRaw,
    ] = await Promise.all([
      db.select({ total: count() }).from(crmLeads),
      db.select({ total: count() }).from(crmLeads).where(gte(crmLeads.createdAt, new Date(inicioMes))),
      db.select({ total: count() }).from(crmPessoas),
      db.select({ total: count() }).from(crmOportunidades),
      db
        .select({ status: crmOportunidades.status, total: count() })
        .from(crmOportunidades)
        .groupBy(crmOportunidades.status),
      db.select({ total: count() }).from(crmOportunidades).where(gte(crmOportunidades.createdAt, new Date(inicioMes))),
      db.select({ total: count() }).from(crmPropostas),
      db
        .select({ status: crmPropostas.status, total: count() })
        .from(crmPropostas)
        .groupBy(crmPropostas.status),
      db.select({ total: count() }).from(crmVisitas),
      db.select({ total: count() }).from(crmVisitas).where(eq(crmVisitas.dataVisita, hoje)),
      db.select({ total: count() }).from(crmTarefas).where(eq(crmTarefas.status, "PENDENTE")),
      db
        .select({ total: count() })
        .from(crmTarefas)
        .where(and(eq(crmTarefas.status, "PENDENTE"), lte(crmTarefas.dataPrevista, hoje))),
      db
        .select({
          empresaId: crmOportunidades.empresaId,
          empresaNome: crmPessoas.razaoSocial,
          totalValor: sql<string>`SUM(COALESCE(${crmOportunidades.valorEstimado}, 0)::numeric)`,
        })
        .from(crmOportunidades)
        .leftJoin(crmPessoas, eq(crmOportunidades.empresaId, crmPessoas.id))
        .where(sql`${crmOportunidades.status} NOT IN ('FECHADO_PERDIDO', 'FECHADO_GANHO')`)
        .groupBy(crmOportunidades.empresaId, crmPessoas.razaoSocial)
        .orderBy(desc(sql`SUM(COALESCE(${crmOportunidades.valorEstimado}, 0)::numeric)`))
        .limit(5),
      db
        .select({ total: sql<string>`COALESCE(SUM(${crmOportunidades.valorEstimado}), 0)` })
        .from(crmOportunidades)
        .where(sql`${crmOportunidades.status} NOT IN ('FECHADO_PERDIDO', 'FECHADO_GANHO')`),
      db
        .select({
          id: crmTimelineEventos.id,
          tipo: crmTimelineEventos.tipo,
          descricao: crmTimelineEventos.descricao,
          dataEvento: crmTimelineEventos.dataEvento,
        })
        .from(crmTimelineEventos)
        .orderBy(desc(crmTimelineEventos.dataEvento))
        .limit(10),
      db
        .select({
          periodo: crmPrevisaoVendas.periodo,
          valorPrevisto: crmPrevisaoVendas.valorPrevisto,
          valorReal: crmPrevisaoVendas.valorReal,
          dados: crmPrevisaoVendas.dados,
        })
        .from(crmPrevisaoVendas)
        .orderBy(desc(crmPrevisaoVendas.periodo))
        .limit(12),
    ])

    const getCount = (rows: { total: number }[]) => Number(rows[0]?.total ?? 0)

    const oportunidadesFechadoGanho = await db
      .select({ total: count() })
      .from(crmOportunidades)
      .where(eq(crmOportunidades.status, "FECHADO_GANHO"))
    const totalConvertidas = getCount(oportunidadesFechadoGanho)

    return NextResponse.json({
      leads: { total: getCount(leadsTotal), esteMes: getCount(leadsMes) },
      pessoas: { total: getCount(empresasTotal) },
      oportunidades: {
        total: getCount(oportunidadesTotal),
        esteMes: getCount(oportunidadesMes),
        byStatus: oportunidadesByStatus.map((r) => ({ status: r.status, total: Number(r.total) })),
      },
      propostas: {
        total: getCount(propostasTotal),
        byStatus: propostasByStatus.map((r) => ({ status: r.status, total: Number(r.total) })),
      },
      visitas: { total: getCount(visitasTotal), hoje: getCount(visitasHoje) },
      tarefas: { pendentes: getCount(tarefasPendentes), vencendo: getCount(tarefasVencendo) },
      topEmpresas: topEmpresasRaw.map((r) => ({
        empresaId: r.empresaId,
        empresaNome: r.empresaNome || "Sem nome",
        totalValor: Number(r.totalValor),
      })),
      forecast: Number(forecastRaw[0]?.total ?? 0),
      conversao: {
        oportunidadesConvertidas: totalConvertidas,
        totalOportunidades: getCount(oportunidadesTotal),
      },
      recentes: recentesRaw.map((r) => ({
        id: r.id,
        tipo: r.tipo,
        descricao: r.descricao,
        dataEvento: r.dataEvento,
      })),
      previsaoVendas: previsaoVendasRaw.map((r) => ({
        periodo: r.periodo,
        valorPrevisto: Number(r.valorPrevisto),
        valorReal: r.valorReal ? Number(r.valorReal) : null,
        dados: r.dados,
      })),
    })
  } catch (error) {
    console.error("[GET /api/crm/dashboard]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
