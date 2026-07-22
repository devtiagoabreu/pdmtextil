import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
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
    const isMine = mine === "true" && auth.session.user.role !== "ADMIN" && auth.session.user.role !== "SUDO"
    const mineCondition = isMine ? eq(crmVisitas.criadoPor, auth.userId) : undefined

    const now = new Date()
    const hoje = now.toISOString().split("T")[0]
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const [
      totalVisitas,
      realizadas,
      canceladas,
      agendadas,
      visitasHoje,
      visitasMes,
      byTipo,
      byStatus,
      porRepresentante,
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
        .select({
          representanteId: crmVisitas.criadoPor,
          representanteNome: usuarios.name,
          total: count(),
        })
        .from(crmVisitas)
        .leftJoin(usuarios, eq(crmVisitas.criadoPor, usuarios.id))
        .where(mineCondition)
        .groupBy(crmVisitas.criadoPor, usuarios.name)
        .orderBy(desc(count()))
        .limit(10),
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
      db.select({ total: count() }).from(crmPesquisasSatisfacao),
      db.select({ total: count() }).from(crmPesquisasSatisfacao).where(eq(crmPesquisasSatisfacao.status, "ABERTO")),
      db.select({ total: count() }).from(crmPesquisasSatisfacao).where(eq(crmPesquisasSatisfacao.status, "RESPONDIDO")),
    ])

    const getCount = (rows: { total: number }[]) => Number(rows[0]?.total ?? 0)

    return NextResponse.json({
      total: getCount(totalVisitas),
      realizadas: getCount(realizadas),
      canceladas: getCount(canceladas),
      agendadas: getCount(agendadas),
      hoje: getCount(visitasHoje),
      esteMes: getCount(visitasMes),
      byTipo: byTipo.map((r) => ({ tipo: r.tipo, total: Number(r.total) })),
      byStatus: byStatus.map((r) => ({ status: r.status, total: Number(r.total) })),
      porRepresentante: porRepresentante.map((r) => ({
        representanteId: r.representanteId,
        representanteNome: r.representanteNome || "Sem nome",
        total: Number(r.total),
      })),
      ultimasVisitas: ultimasVisitas.map((r) => ({
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
