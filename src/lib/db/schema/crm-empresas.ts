import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { clientes } from "./clientes"

export const crmEmpresas = pgTable("crm_empresas", {
  id: serial("id").primaryKey(),
  razaoSocial: varchar("razao_social", { length: 250 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 200 }),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  segmento: varchar("segmento", { length: 100 }),
  porte: varchar("porte", { length: 50 }),
  site: varchar("site", { length: 255 }),
  observacoes: text("observacoes"),
  status: varchar("status", { length: 30 }).notNull().default("NOVO"),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmEmpresa = typeof crmEmpresas.$inferSelect
export type NewCrmEmpresa = typeof crmEmpresas.$inferInsert
