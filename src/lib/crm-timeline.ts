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
