import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPesquisasSatisfacao } from "@/lib/db/schema/crm-pesquisas-satisfacao"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, and, gte } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const filtro = searchParams.get("filtro") || "total"
    const mine = searchParams.get("mine")
    const isMine = mine === "true"

    const conditions: any[] = []
    if (isMine) conditions.push(eq(crmVisitas.criadoPor, auth.userId))

    const now = new Date()
    const hoje = now.toISOString().split("T")[0]
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    let innerJoinPesquisa = false
    if (filtro === "realizadas") conditions.push(eq(crmVisitas.status, "REALIZADA"))
    else if (filtro === "canceladas") conditions.push(eq(crmVisitas.status, "CANCELADA"))
    else if (filtro === "agendadas") conditions.push(eq(crmVisitas.status, "AGENDADA"))
    else if (filtro === "hoje") conditions.push(eq(crmVisitas.dataVisita, hoje))
    else if (filtro === "este-mes") conditions.push(gte(crmVisitas.dataVisita, inicioMes))
    else if (filtro === "pesquisas-respondidas") {
      innerJoinPesquisa = true
      conditions.push(eq(crmPesquisasSatisfacao.status, "RESPONDIDO"))
    } else if (filtro.startsWith("tipo-")) conditions.push(eq(crmVisitas.tipo, filtro.slice(5)))
    else if (filtro.startsWith("status-")) conditions.push(eq(crmVisitas.status, filtro.slice(7)))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    let query = db
      .select({
        id: crmVisitas.id,
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
        nomeAvulso: crmVisitas.nomeAvulso,
        empresaId: crmVisitas.empresaId,
        empresaNome: crmPessoas.razaoSocial,
        clienteId: crmVisitas.clienteId,
        clienteNome: clientes.nome,
        criadoPorNome: usuarios.name,
        createdAt: crmVisitas.createdAt,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .leftJoin(usuarios, eq(crmVisitas.criadoPor, usuarios.id))

    if (innerJoinPesquisa) {
      query = query
        .innerJoin(crmPesquisasSatisfacao, eq(crmPesquisasSatisfacao.visitaId, crmVisitas.id))
        .distinctOn([crmVisitas.id])
    }

    const rows = await query.where(where).orderBy(desc(crmVisitas.id)).limit(500)

    return NextResponse.json(
      rows.map((r: any) => ({
        id: r.id,
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
        nomeAvulso: r.nomeAvulso,
        empresaId: r.empresaId,
        empresaNome: r.empresaNome,
        clienteId: r.clienteId,
        clienteNome: r.clienteNome,
        criadoPorNome: r.criadoPorNome,
        createdAt: r.createdAt,
      }))
    )
  } catch (error) {
    console.error("[GET /api/crm/visitas/dashboard-lista]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
