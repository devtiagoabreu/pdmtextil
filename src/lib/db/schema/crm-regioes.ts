import { pgTable, serial, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const REGIAO_SIGLAS = ["N", "NE", "CO", "SE", "S"] as const
export const REGIAO_LABELS: Record<string, string> = {
  N: "Norte",
  NE: "Nordeste",
  CO: "Centro-Oeste",
  SE: "Sudeste",
  S: "Sul",
}

export const crmRegioes = pgTable("crm_regioes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  uf: varchar("uf", { length: 3 }),
  gerenteId: integer("gerente_id").references(() => usuarios.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmRegiao = typeof crmRegioes.$inferSelect
export type NewCrmRegiao = typeof crmRegioes.$inferInsert
