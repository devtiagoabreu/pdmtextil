import { pgTable, serial, integer, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core"
import { crmViagens } from "./crm-viagens"

export const crmViagensInvestimentos = pgTable("crm_viagens_investimentos", {
  id: serial("id").primaryKey(),
  viagemId: integer("viagem_id").notNull().references(() => crmViagens.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmViagemInvestimento = typeof crmViagensInvestimentos.$inferSelect
export type NewCrmViagemInvestimento = typeof crmViagensInvestimentos.$inferInsert
