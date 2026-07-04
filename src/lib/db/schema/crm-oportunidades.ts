import { pgTable, serial, varchar, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { crmLeads } from "./crm-leads"
import { crmEmpresas } from "./crm-empresas"
import { crmContatos } from "./crm-contatos"

export const crmOportunidades = pgTable("crm_oportunidades", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  descricao: text("descricao"),
  valorEstimado: numeric("valor_estimado", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 30 }).notNull().default("NOVO"),
  leadId: integer("lead_id").references(() => crmLeads.id),
  empresaId: integer("empresa_id").references(() => crmEmpresas.id),
  contatoId: integer("contato_id").references(() => crmContatos.id),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  dataFechamentoPrevista: date("data_fechamento_prevista"),
  probabilidade: integer("probabilidade").default(0),
  motivoPerda: text("motivo_perda"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmOportunidade = typeof crmOportunidades.$inferSelect
export type NewCrmOportunidade = typeof crmOportunidades.$inferInsert
