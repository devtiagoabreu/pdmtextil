import { eq } from "drizzle-orm"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { crmFaturamentos } from "@/lib/db/schema/crm-faturamentos"
import { crmFaturamentoItens } from "@/lib/db/schema/crm-faturamento-itens"
import { crmPedidosVenda } from "@/lib/db/schema/crm-pedidos-venda"
import { crmPedidoVendaItens } from "@/lib/db/schema/crm-pedido-venda-itens"
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

  const faturamentos = await tx
    .select({ id: crmFaturamentos.id })
    .from(crmFaturamentos)
    .where(eq(crmFaturamentos.oportunidadeId, oportunidadeId))
  for (const f of faturamentos) {
    await tx.delete(crmFaturamentoItens).where(eq(crmFaturamentoItens.faturamentoId, f.id))
  }
  await tx.delete(crmFaturamentos).where(eq(crmFaturamentos.oportunidadeId, oportunidadeId))

  const pedidos = await tx
    .select({ id: crmPedidosVenda.id })
    .from(crmPedidosVenda)
    .where(eq(crmPedidosVenda.oportunidadeId, oportunidadeId))
  for (const p of pedidos) {
    await tx.delete(crmPedidoVendaItens).where(eq(crmPedidoVendaItens.pedidoVendaId, p.id))
  }
  await tx.delete(crmPedidosVenda).where(eq(crmPedidosVenda.oportunidadeId, oportunidadeId))

  await excluirTimelineEventosEntidade(
    { tipo: "OPORTUNIDADE", campo: "oportunidadeId", id: oportunidadeId },
    tx
  )
  await tx.delete(crmOportunidades).where(eq(crmOportunidades.id, oportunidadeId))
}
