import { pgTable, serial, integer, varchar, numeric, timestamp } from "drizzle-orm/pg-core"
import { crmFaturamentos } from "./crm-faturamentos"

export const crmFaturamentoItens = pgTable("crm_faturamento_itens", {
  id: serial("id").primaryKey(),
  faturamentoId: integer("faturamento_id").notNull().references(() => crmFaturamentos.id, { onDelete: "cascade" }),
  produto: varchar("produto", { length: 300 }).notNull(),
  codigo: varchar("codigo", { length: 100 }),
  unidade: varchar("unidade", { length: 20 }).notNull().default("METROS"),
  unidadeOutra: varchar("unidade_outra", { length: 50 }),
  quantidade: numeric("quantidade", { precision: 14, scale: 3 }),
  valorUnitario: numeric("valor_unitario", { precision: 12, scale: 2 }),
  valorTotal: numeric("valor_total", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmFaturamentoItem = typeof crmFaturamentoItens.$inferSelect
export type NewCrmFaturamentoItem = typeof crmFaturamentoItens.$inferInsert