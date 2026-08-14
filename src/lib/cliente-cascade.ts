import { eq, sql } from "drizzle-orm"
import { clientes } from "@/lib/db/schema/clientes"
import { clientesRepresentantes } from "@/lib/db/schema/clientes-representantes"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"

export async function excluirClienteCascade(tx: any, clienteId: number) {
  await tx.delete(clientesRepresentantes).where(eq(clientesRepresentantes.clienteId, clienteId))
  await tx.update(crmPessoas).set({ clienteId: null }).where(eq(crmPessoas.clienteId, clienteId))
  await tx.update(crmContatos).set({ clienteId: null }).where(eq(crmContatos.clienteId, clienteId))
  await tx.update(crmOportunidades).set({ clienteId: null }).where(eq(crmOportunidades.clienteId, clienteId))
  await tx.update(crmPropostas).set({ clienteId: null }).where(eq(crmPropostas.clienteId, clienteId))
  await tx.update(crmVisitas).set({ clienteId: null }).where(eq(crmVisitas.clienteId, clienteId))
  await tx.execute(sql`UPDATE crm_empresas SET cliente_id = NULL WHERE cliente_id = ${clienteId}`)
  return tx.delete(clientes).where(eq(clientes.id, clienteId)).returning()
}
