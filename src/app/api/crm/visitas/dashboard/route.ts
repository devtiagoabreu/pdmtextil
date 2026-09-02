import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmViagens } from "@/lib/db/schema/crm-viagens"
import { crmPesquisasSatisfacao } from "@/lib/db/schema/crm-pesquisas-satisfacao"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql, and, gte, count } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const mine = searchParams.get("mine")
    const isMine = mine === "true"
    const mineCondition = isMine ? eq(crmVisitas.criadoPor, auth.userId) : undefined

    const now = new Date()
    const hoje = now.toISOString().split("T")[0]
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const realizadasCondition = mineCondition
      ? and(mineCondition, eq(crmVisitas.status, "REALIZADA"))
      : eq(crmVisitas.status, "REALIZADA")

    const [
      totalVisitas,
      realizadas,
      canceladas,
      agendadas,
      visitasHoje,
      visitasMes,
      byTipo,
      byStatus,
      porDia,
      porGerenteRaw,
      viagens,
      ultimasVisitas,
      pesquisasEnviadas,
      pesquisasAbertas,
      pesquisasRespondidas,
    ] = await Promise.all([
      db.select({ total: count() }).from(crmVisitas).where(mineCondition),
      db.select({ total: count() }).from(crmVisitas).where(mineCondition ? and(mineCondition, eq(crmVisitas.status, "REALIZADA")) : eq(crmVisitas.status, "REALIZADA")),
      db.select({ total: count() }).from(crmVisitas).where(mineCondition ? and(mineCondition, eq(crmVisitas.status, "CANCELADA")) : eq(crmVisitas.status, "CANCELADA")),
      db.select({ total: count() }).from(crmVisitas).where(mineCondition ? and(mineCondition, eq(crmVisitas.status, "AGENDADA")) : eq(crmVisitas.status, "AGENDADA")),
      db.select({ total: count() }).from(crmVisitas).where(mineCondition ? and(mineCondition, eq(crmVisitas.dataVisita, hoje)) : eq(crmVisitas.dataVisita, hoje)),
      db.select({ total: count() }).from(crmVisitas).where(mineCondition ? and(mineCondition, gte(crmVisitas.dataVisita, inicioMes)) : gte(crmVisitas.dataVisita, inicioMes)),
      db
        .select({ tipo: crmVisitas.tipo, total: count() })
        .from(crmVisitas)
        .where(mineCondition)
        .groupBy(crmVisitas.tipo),
      db
        .select({ status: crmVisitas.status, total: count() })
        .from(crmVisitas)
        .where(mineCondition)
        .groupBy(crmVisitas.status),
      db
        .select({ dia: crmVisitas.dataVisita, total: count() })
        .from(crmVisitas)
        .where(realizadasCondition)
        .groupBy(crmVisitas.dataVisita)
        .orderBy(crmVisitas.dataVisita),
      db
        .select({
          gerenteId: crmVisitas.criadoPor,
          gerenteNome: usuarios.name,
          dataVisita: crmVisitas.dataVisita,
          total: count(),
        })
        .from(crmVisitas)
        .leftJoin(usuarios, eq(crmVisitas.criadoPor, usuarios.id))
        .where(realizadasCondition)
        .groupBy(crmVisitas.criadoPor, usuarios.name, crmVisitas.dataVisita),
      db
        .select({
          viagemId: crmVisitas.viagemId,
          viagemTitulo: crmViagens.titulo,
          total: count(),
        })
        .from(crmVisitas)
        .leftJoin(crmViagens, eq(crmVisitas.viagemId, crmViagens.id))
        .where(mineCondition)
        .groupBy(crmVisitas.viagemId, crmViagens.titulo),
      db
        .select({
          id: crmVisitas.id,
          empresaId: crmVisitas.empresaId,
          clienteId: crmVisitas.clienteId,
          dataVisita: crmVisitas.dataVisita,
          hora: crmVisitas.hora,
          tipo: crmVisitas.tipo,
          status: crmVisitas.status,
          endereco: crmVisitas.endereco,
          numero: crmVisitas.numero,
          complemento: crmVisitas.complemento,
          bairro: crmVisitas.bairro,
          cidade: crmVisitas.cidade,
          uf: crmVisitas.uf,
        })
        .from(crmVisitas)
        .where(mineCondition)
        .orderBy(desc(crmVisitas.createdAt))
        .limit(5),
      db.select({ total: count() }).from(crmPesquisasSatisfacao).innerJoin(crmVisitas, eq(crmPesquisasSatisfacao.visitaId, crmVisitas.id)).where(mineCondition),
      db.select({ total: count() }).from(crmPesquisasSatisfacao).innerJoin(crmVisitas, eq(crmPesquisasSatisfacao.visitaId, crmVisitas.id)).where(mineCondition ? and(mineCondition, eq(crmPesquisasSatisfacao.status, "ABERTO")) : eq(crmPesquisasSatisfacao.status, "ABERTO")),
      db.select({ total: count() }).from(crmPesquisasSatisfacao).innerJoin(crmVisitas, eq(crmPesquisasSatisfacao.visitaId, crmVisitas.id)).where(mineCondition ? and(mineCondition, eq(crmPesquisasSatisfacao.status, "RESPONDIDO")) : eq(crmPesquisasSatisfacao.status, "RESPONDIDO")),
    ])

    const getCount = (rows: { total: number }[]) => Number(rows[0]?.total ?? 0)

    type GerenteAcc = {
      gerenteId: number | null
      gerenteNome: string
      visitas: number
      diasAtivos: number
      melhorDia: { dia: string; total: number } | null
      piorDia: { dia: string; total: number } | null
      _dias: Map<string, number>
    }

    const gerentes = new Map<number | null, GerenteAcc>()
    for (const r of porGerenteRaw as any[]) {
      let g = gerentes.get(r.gerenteId)
      if (!g) {
        g = {
          gerenteId: r.gerenteId,
          gerenteNome: r.gerenteNome || "Sem nome",
          visitas: 0,
          diasAtivos: 0,
          melhorDia: null,
          piorDia: null,
          _dias: new Map(),
        }
        gerentes.set(r.gerenteId, g)
      }
      const total = Number(r.total)
      g.visitas += total
      g._dias.set(r.dataVisita, (g._dias.get(r.dataVisita) || 0) + total)
    }

    const porGerente = [...gerentes.values()].map((g) => {
      g.diasAtivos = g._dias.size
      const dias = [...g._dias.entries()]
      if (dias.length > 0) {
        dias.sort((a, b) => a[1] - b[1])
        g.piorDia = { dia: dias[0][0], total: dias[0][1] }
        dias.reverse()
        g.melhorDia = { dia: dias[0][0], total: dias[0][1] }
      }
      const { _dias, ...rest } = g
      return {
        ...rest,
        mediaPorDia: g.diasAtivos > 0 ? Number((g.visitas / g.diasAtivos).toFixed(1)) : 0,
      }
    })
    porGerente.sort((a, b) => b.visitas - a.visitas)

    return NextResponse.json({
      total: getCount(totalVisitas),
      realizadas: getCount(realizadas),
      canceladas: getCount(canceladas),
      agendadas: getCount(agendadas),
      hoje: getCount(visitasHoje),
      esteMes: getCount(visitasMes),
      byTipo: byTipo.map((r: any) => ({ tipo: r.tipo, total: Number(r.total) })),
      byStatus: byStatus.map((r: any) => ({ status: r.status, total: Number(r.total) })),
      porDia: porDia.map((r: any) => ({ dia: r.dia, total: Number(r.total) })),
      porGerente,
      viagens: viagens.map((r: any) => ({
        viagemId: r.viagemId,
        viagemTitulo: r.viagemId ? r.viagemTitulo : "Sem viagem",
        total: Number(r.total),
      })),
      ultimasVisitas: ultimasVisitas.map((r: any) => ({
        id: r.id,
        empresaId: r.empresaId,
        clienteId: r.clienteId,
        dataVisita: r.dataVisita,
        hora: r.hora,
        tipo: r.tipo,
        status: r.status,
        endereco: r.endereco,
        numero: r.numero,
        complemento: r.complemento,
        bairro: r.bairro,
        cidade: r.cidade,
        uf: r.uf,
      })),
      pesquisas: {
        enviadas: getCount(pesquisasEnviadas),
        abertas: getCount(pesquisasAbertas),
        respondidas: getCount(pesquisasRespondidas),
      },
    })
  } catch (error) {
    console.error("[GET /api/crm/visitas/dashboard]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
