import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { eq } from "drizzle-orm"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { leadId, empresaId, responsavelId, motivo } = body

    if (!leadId && !empresaId) {
      return NextResponse.json({ error: "leadId ou empresaId é obrigatório" }, { status: 400 })
    }

    let nomeEntidade = ""
    let entidadeId = 0
    let empresaVinculada: number | null = empresaId || null

    if (leadId) {
      const lead = await db
        .select({ nome: crmLeads.nome, empresaId: crmLeads.empresaId })
        .from(crmLeads)
        .where(eq(crmLeads.id, leadId))
        .then(r => r[0])
      if (lead) {
        nomeEntidade = lead.nome
        entidadeId = leadId
        empresaVinculada = lead.empresaId || empresaVinculada
      }
    } else if (empresaId) {
      const empresa = await db
        .select({ razaoSocial: crmPessoas.razaoSocial })
        .from(crmPessoas)
        .where(eq(crmPessoas.id, empresaId))
        .then(r => r[0])
      if (empresa) {
        nomeEntidade = empresa.razaoSocial || ""
        entidadeId = empresaId
      }
    }

    const dataPrevista = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const [tarefa] = await db
      .insert(crmTarefas)
      .values({
        titulo: `Reativação: ${nomeEntidade}`,
        descricao: motivo || `Reativação automática sugerida pela IA — ${nomeEntidade}`,
        tipo: "TAREFA",
        status: "PENDENTE",
        responsavelId: responsavelId || auth.userId,
        empresaId: empresaVinculada,
        dataPrevista,
      })
      .returning()

    if (empresaVinculada) {
      await inserirTimelineEvento({
        empresaId: empresaVinculada,
        tipo: "TAREFA",
        descricao: `Tarefa de reativação automática criada pela IA: "${motivo || nomeEntidade}"`,
        metadados: { tarefaId: tarefa.id, origem: "IA_REATIVACAO" },
      })
    }

    return NextResponse.json(tarefa, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/ia/reativar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
