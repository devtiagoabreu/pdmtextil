import { pgTable, serial, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const crmRegioes = pgTable("crm_regioes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  uf: varchar("uf", { length: 2 }),
  gerenteId: integer("gerente_id").references(() => usuarios.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmRegiao = typeof crmRegioes.$inferSelect
export type NewCrmRegiao = typeof crmRegioes.$inferInsert
