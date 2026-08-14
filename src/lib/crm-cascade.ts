import { eq } from "drizzle-orm"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { excluirTimelineEventosEntidade } from "./crm-timeline"

export async function excluirOportunidadeCascade(tx: any, oportunidadeId: number) {
  const visitas = await tx
    .select({ id: crmVisitas.id })
    .from(crmVisitas)
    .where(eq(crmVisitas.oportunidadeId, oportunidadeId))
  for (const v of visitas) {
    await excluirTimelineEventosEntidade({ tipo: "VISITA", campo: "visitaId", id: v.id }, tx)
  }
  await tx.delete(crmVisitas).where(eq(crmVisitas.oportunidadeId, oportunidadeId))

  const tarefas = await tx
    .select({ id: crmTarefas.id })
    .from(crmTarefas)
    .where(eq(crmTarefas.oportunidadeId, oportunidadeId))
  for (const t of tarefas) {
    await excluirTimelineEventosEntidade({ tipo: "TAREFA", campo: "tarefaId", id: t.id }, tx)
  }
  await tx.delete(crmTarefas).where(eq(crmTarefas.oportunidadeId, oportunidadeId))

  const propostas = await tx
    .select({ id: crmPropostas.id })
    .from(crmPropostas)
    .where(eq(crmPropostas.oportunidadeId, oportunidadeId))
  for (const p of propostas) {
    await excluirTimelineEventosEntidade({ tipo: "PROPOSTA", campo: "propostaId", id: p.id }, tx)
  }
  await tx.delete(crmPropostas).where(eq(crmPropostas.oportunidadeId, oportunidadeId))

  await excluirTimelineEventosEntidade(
    { tipo: "OPORTUNIDADE", campo: "oportunidadeId", id: oportunidadeId },
    tx
  )
  await tx.delete(crmOportunidades).where(eq(crmOportunidades.id, oportunidadeId))
}
