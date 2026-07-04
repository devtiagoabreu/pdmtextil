import { pgTable, serial, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { crmRegioes } from "./crm-regioes"
import { usuarios } from "./usuarios"

export const crmEquipes = pgTable("crm_equipes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  regiaoId: integer("regiao_id").references(() => crmRegioes.id),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmEquipe = typeof crmEquipes.$inferSelect
export type NewCrmEquipe = typeof crmEquipes.$inferInsert
