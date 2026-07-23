import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql, like, or, and, count, gte, lte } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    const status = searchParams.get("status")
    const mine = searchParams.get("mine")
    const q = searchParams.get("q")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const all = searchParams.get("all") === "true"
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    const conditions = []
    if (empresaId) conditions.push(eq(crmVisitas.empresaId, parseInt(empresaId)))
    if (status) conditions.push(eq(crmVisitas.status, status))
    if (mine === "true" && auth.session.user.role !== "ADMIN" && auth.session.user.role !== "SUDO") {
      conditions.push(eq(crmVisitas.criadoPor, auth.userId))
    }
    if (q) {
      const searchPattern = `%${q}%`
      conditions.push(
        or(
          like(crmPessoas.razaoSocial, searchPattern),
          like(clientes.nome, searchPattern),
          like(crmOportunidades.titulo, searchPattern),
        )!
      )
    }
    if (dataInicio) conditions.push(gte(crmVisitas.dataVisita, dataInicio))
    if (dataFim) conditions.push(lte(crmVisitas.dataVisita, dataFim))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db
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
        cep: crmVisitas.cep,
        relato: crmVisitas.relato,
        empresaId: crmVisitas.empresaId,
        empresaNome: crmPessoas.razaoSocial,
        clienteId: crmVisitas.clienteId,
        clienteNome: clientes.nome,
        oportunidadeId: crmVisitas.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        contatoId: crmVisitas.contatoId,
        criadoPor: crmVisitas.criadoPor,
        criadoPorNome: usuarios.name,
        duracaoEstimada: crmVisitas.duracaoEstimada,
        fotos: crmVisitas.fotos,
        motivoCancelamento: crmVisitas.motivoCancelamento,
        createdAt: crmVisitas.createdAt,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .leftJoin(crmOportunidades, eq(crmVisitas.oportunidadeId, crmOportunidades.id))
      .leftJoin(usuarios, eq(crmVisitas.criadoPor, usuarios.id))
      .where(where)

    if (all) {
      const lista = await baseQuery.orderBy(desc(crmVisitas.dataVisita))
      return NextResponse.json(lista)
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .leftJoin(crmOportunidades, eq(crmVisitas.oportunidadeId, crmOportunidades.id))
      .where(where)

    const lista = await baseQuery
      .orderBy(desc(crmVisitas.dataVisita))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({
      data: lista,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    })
  } catch (error) {
    console.error("[GET /api/crm/visitas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()

    const baseValues = {
      empresaId: body.empresaId || null,
      clienteId: body.clienteId || null,
      oportunidadeId: body.oportunidadeId || null,
      contatoId: body.contatoId || null,
      hora: body.hora || null,
      tipo: body.tipo || "PRESENCIAL",
      status: "AGENDADA" as const,
      endereco: body.endereco || null,
      numero: body.numero || null,
      complemento: body.complemento || null,
      bairro: body.bairro || null,
      cidade: body.cidade || null,
      uf: body.uf || null,
      cep: body.cep || null,
      relato: body.relato || null,
      fotos: body.fotos || [],
      duracaoEstimada: body.duracaoEstimada || null,
      criadoPor: userId,
    }

    const datas: string[] = [body.dataVisita]

    if (body.recorrencia && body.recorrenciaFim) {
      const interval = body.recorrencia === "semanal" ? 7 : body.recorrencia === "quinzenal" ? 14 : 30
      const start = new Date(body.dataVisita + "T12:00:00")
      const end = new Date(body.recorrenciaFim + "T12:00:00")
      const current = new Date(start)
      while (true) {
        current.setDate(current.getDate() + interval)
        if (current > end) break
        datas.push(current.toISOString().split("T")[0])
      }
    }

    const inserted = await db
      .insert(crmVisitas)
      .values(datas.map(d => ({ ...baseValues, dataVisita: d })))
      .returning()

    const primeira = inserted[0]

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Visita criada para empresa ID ${body.empresaId} em ${body.dataVisita}${datas.length > 1 ? ` (${datas.length} recorrencias)` : ""}`,
      entidade: "CrmVisita",
      entidadeId: primeira.id,
      usuarioNome: session.user.name,
    })

    if (primeira.empresaId) {
      await inserirTimelineEvento({
        empresaId: primeira.empresaId,
        tipo: "VISITA",
        descricao: `Visita ${primeira.tipo} agendada para ${new Date(primeira.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")}${datas.length > 1 ? ` (${datas.length} recorrencias)` : ""}`,
        metadados: { visitaId: primeira.id, tipo: primeira.tipo, dataVisita: primeira.dataVisita },
      })
    }

    await notificar("VISITA_CRIADA", `Visita ${primeira.tipo} agendada para ${new Date(primeira.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")}${datas.length > 1 ? ` (${datas.length} recorrencias)` : ""}`, `/comercial/crm/visitas/${primeira.id}`, session.user.name)

    return NextResponse.json({ visita: primeira, total: inserted.length }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/visitas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
