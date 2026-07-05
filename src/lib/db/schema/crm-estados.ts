import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { REGIAO_SIGLAS } from "./crm-regioes"

export const crmEstados = pgTable("crm_estados", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  uf: varchar("uf", { length: 2 }).notNull().unique(),
  regiao: varchar("regiao", { length: 3 }),
  gerenteId: integer("gerente_id").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmEstado = typeof crmEstados.$inferSelect
export type NewCrmEstado = typeof crmEstados.$inferInsert
