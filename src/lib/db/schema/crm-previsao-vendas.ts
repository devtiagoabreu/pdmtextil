import { pgTable, serial, varchar, numeric, timestamp, jsonb } from "drizzle-orm/pg-core"

export const crmPrevisaoVendas = pgTable("crm_previsao_vendas", {
  id: serial("id").primaryKey(),
  periodo: varchar("periodo", { length: 7 }).notNull(),
  valorPrevisto: numeric("valor_previsto", { precision: 14, scale: 2 }).notNull(),
  valorReal: numeric("valor_real", { precision: 14, scale: 2 }),
  dados: jsonb("dados").$type<{
    totalOportunidades?: number
    totalEmpresas?: number
    probabilidadeMedia?: number
    segmentos?: Record<string, number>
    representantes?: Record<string, number>
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmPrevisaoVendas = typeof crmPrevisaoVendas.$inferSelect
export type NewCrmPrevisaoVendas = typeof crmPrevisaoVendas.$inferInsert
