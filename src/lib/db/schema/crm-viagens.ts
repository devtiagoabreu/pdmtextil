import { pgTable, serial, varchar, text, integer, date, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const crmViagens = pgTable("crm_viagens", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  descricao: text("descricao"),
  destinoCidade: varchar("destino_cidade", { length: 150 }),
  destinoUf: varchar("destino_uf", { length: 2 }),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  status: varchar("status", { length: 20 }).notNull().default("PLANEJADA"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmViagem = typeof crmViagens.$inferSelect
export type NewCrmViagem = typeof crmViagens.$inferInsert
