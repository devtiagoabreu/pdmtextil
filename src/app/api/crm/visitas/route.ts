import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    const status = searchParams.get("status")

    const conditions = []
    if (empresaId) conditions.push(eq(crmVisitas.empresaId, parseInt(empresaId)))
    if (status) conditions.push(eq(crmVisitas.status, status))

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmVisitas.id,
        dataVisita: crmVisitas.dataVisita,
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
        oportunidadeId: crmVisitas.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        contatoId: crmVisitas.contatoId,
        criadoPorNome: usuarios.name,
        fotos: crmVisitas.fotos,
        motivoCancelamento: crmVisitas.motivoCancelamento,
        createdAt: crmVisitas.createdAt,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(crmOportunidades, eq(crmVisitas.oportunidadeId, crmOportunidades.id))
      .leftJoin(usuarios, eq(crmVisitas.criadoPor, usuarios.id))
      .where(where)
      .orderBy(desc(crmVisitas.dataVisita))

    return NextResponse.json(lista)
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

    const [nova] = await db
      .insert(crmVisitas)
      .values({
        empresaId: body.empresaId,
        oportunidadeId: body.oportunidadeId || null,
        contatoId: body.contatoId || null,
        dataVisita: body.dataVisita,
        tipo: body.tipo || "PRESENCIAL",
        status: "AGENDADA",
        endereco: body.endereco || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        uf: body.uf || null,
        cep: body.cep || null,
        relato: body.relato || null,
        fotos: body.fotos || [],
        criadoPor: userId,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Visita criada para empresa ID ${body.empresaId} em ${body.dataVisita}`,
      entidade: "CrmVisita",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await inserirTimelineEvento({
      empresaId: nova.empresaId,
      tipo: "VISITA",
      descricao: `Visita ${nova.tipo} agendada para ${new Date(nova.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")}`,
      metadados: { visitaId: nova.id, tipo: nova.tipo, dataVisita: nova.dataVisita },
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/visitas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
