import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
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
    const status = searchParams.get("status")
    const responsavelId = searchParams.get("responsavelId")
    const empresaId = searchParams.get("empresaId")
    const hoje = searchParams.get("hoje")

    const conditions = []
    if (status) conditions.push(eq(crmTarefas.status, status))
    if (responsavelId) conditions.push(eq(crmTarefas.responsavelId, parseInt(responsavelId)))
    if (empresaId) conditions.push(eq(crmTarefas.empresaId, parseInt(empresaId)))
    if (hoje === "true") conditions.push(eq(crmTarefas.dataPrevista, sql`CURRENT_DATE`))

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmTarefas.id,
        titulo: crmTarefas.titulo,
        descricao: crmTarefas.descricao,
        tipo: crmTarefas.tipo,
        dataPrevista: crmTarefas.dataPrevista,
        dataConclusao: crmTarefas.dataConclusao,
        status: crmTarefas.status,
        empresaId: crmTarefas.empresaId,
        empresaNome: crmEmpresas.razaoSocial,
        oportunidadeId: crmTarefas.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        responsavelId: crmTarefas.responsavelId,
        responsavelNome: usuarios.name,
        criadoPor: crmTarefas.criadoPor,
        createdAt: crmTarefas.createdAt,
      })
      .from(crmTarefas)
      .leftJoin(crmEmpresas, eq(crmTarefas.empresaId, crmEmpresas.id))
      .leftJoin(crmOportunidades, eq(crmTarefas.oportunidadeId, crmOportunidades.id))
      .leftJoin(usuarios, eq(crmTarefas.responsavelId, usuarios.id))
      .where(where)
      .orderBy(desc(crmTarefas.dataPrevista))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/tarefas]", error)
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
      .insert(crmTarefas)
      .values({
        empresaId: body.empresaId || null,
        oportunidadeId: body.oportunidadeId || null,
        titulo: body.titulo,
        descricao: body.descricao || null,
        tipo: body.tipo || "TAREFA",
        dataPrevista: body.dataPrevista || null,
        status: "PENDENTE",
        responsavelId: body.responsavelId || userId,
        criadoPor: userId,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Tarefa criada: ${body.titulo}`,
      entidade: "CrmTarefa",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    if (nova.empresaId) {
      await inserirTimelineEvento({
        empresaId: nova.empresaId,
        tipo: "TAREFA",
        descricao: `Tarefa "${nova.titulo}" criada${nova.dataPrevista ? ` — prevista para ${new Date(nova.dataPrevista + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}`,
        metadados: { tarefaId: nova.id },
      })
    }

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/tarefas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
