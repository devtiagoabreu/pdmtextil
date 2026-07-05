import { pgTable, serial, varchar, integer, timestamp, unique } from "drizzle-orm/pg-core"
import { crmEstados } from "./crm-estados"

export const crmCidades = pgTable("crm_cidades", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  estadoId: integer("estado_id").notNull().references(() => crmEstados.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueNomeEstado: unique().on(table.nome, table.estadoId),
}))

export type CrmCidade = typeof crmCidades.$inferSelect
export type NewCrmCidade = typeof crmCidades.$inferInsert
