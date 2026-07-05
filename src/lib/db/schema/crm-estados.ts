import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core"

export const crmEstados = pgTable("crm_estados", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  uf: varchar("uf", { length: 2 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmEstado = typeof crmEstados.$inferSelect
export type NewCrmEstado = typeof crmEstados.$inferInsert
