import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core"
import { REGIAO_SIGLAS } from "./crm-regioes"

export const crmEstados = pgTable("crm_estados", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  uf: varchar("uf", { length: 2 }).notNull().unique(),
  regiao: varchar("regiao", { length: 3 }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmEstado = typeof crmEstados.$inferSelect
export type NewCrmEstado = typeof crmEstados.$inferInsert
