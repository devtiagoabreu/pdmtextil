import { pgTable, serial, varchar, integer, numeric, timestamp, date, text } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const crmCampanhas = pgTable("crm_campanhas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 300 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull().default("WHATSAPP"),
  descricao: text("descricao"),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  orcamento: numeric("orcamento", { precision: 12, scale: 2 }),
  leadsGerados: integer("leads_gerados").default(0),
  custoAquisicao: numeric("custo_aquisicao", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("ATIVA"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmCampanha = typeof crmCampanhas.$inferSelect
export type NewCrmCampanha = typeof crmCampanhas.$inferInsert
