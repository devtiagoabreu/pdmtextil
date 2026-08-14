import { and, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { crmTimelineEventos } from "@/lib/db/schema/crm-timeline-eventos"

type TipoEvento =
  | "LEAD"
  | "OPORTUNIDADE"
  | "VISITA"
  | "TAREFA"
  | "PROPOSTA"
  | "WHATSAPP"
  | "SOLICITACAO"

export async function inserirTimelineEvento(params: {
  empresaId: number | null
  tipo: TipoEvento
  descricao: string
  metadados?: Record<string, any>
}) {
  if (!params.empresaId) return
  await db.insert(crmTimelineEventos).values({
    empresaId: params.empresaId,
    tipo: params.tipo,
    descricao: params.descricao,
    metadados: params.metadados || {},
    dataEvento: new Date(),
  })
}

export async function excluirTimelineEventosEntidade(
  params: {
    tipo: "LEAD" | "OPORTUNIDADE" | "VISITA" | "TAREFA" | "PROPOSTA"
    campo: "leadId" | "oportunidadeId" | "visitaId" | "tarefaId" | "propostaId"
    id: number
  },
  client: any = db
) {
  if (!params.id) return
  await client.delete(crmTimelineEventos).where(
    and(
      eq(crmTimelineEventos.tipo, params.tipo),
      sql`${crmTimelineEventos.metadados}->>'${sql.raw(params.campo)}' = ${String(params.id)}`
    )
  )
}
