import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { crmEmpresas } from "./crm-empresas"

export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  empresaNome: varchar("empresa_nome", { length: 200 }),
  cargo: varchar("cargo", { length: 100 }),
  origem: varchar("origem", { length: 30 }).notNull().default("OUTRO"),
  status: varchar("status", { length: 30 }).notNull().default("NOVO"),
  descricao: text("descricao"),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  empresaId: integer("empresa_id").references(() => crmEmpresas.id),
  score: integer("score"),
  segmentoIa: varchar("segmento_ia", { length: 100 }),
  porteIa: varchar("porte_ia", { length: 50 }),
  dataClassificacaoIa: timestamp("data_classificacao_ia"),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmLead = typeof crmLeads.$inferSelect
export type NewCrmLead = typeof crmLeads.$inferInsert
