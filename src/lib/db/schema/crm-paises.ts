import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core"

export const crmPaises = pgTable("crm_paises", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 5 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmPais = typeof crmPaises.$inferSelect
export type NewCrmPais = typeof crmPaises.$inferInsert
