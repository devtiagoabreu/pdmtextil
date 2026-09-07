import { pgTable, serial, integer, varchar, numeric, timestamp } from "drizzle-orm/pg-core"
import { crmPedidosVenda } from "./crm-pedidos-venda"

export const crmPedidoVendaItens = pgTable("crm_pedido_venda_itens", {
  id: serial("id").primaryKey(),
  pedidoVendaId: integer("pedido_venda_id").notNull().references(() => crmPedidosVenda.id, { onDelete: "cascade" }),
  produto: varchar("produto", { length: 300 }).notNull(),
  codigo: varchar("codigo", { length: 100 }),
  unidade: varchar("unidade", { length: 20 }).notNull().default("METROS"),
  unidadeOutra: varchar("unidade_outra", { length: 50 }),
  quantidade: numeric("quantidade", { precision: 14, scale: 3 }),
  valorUnitario: numeric("valor_unitario", { precision: 12, scale: 2 }),
  valorTotal: numeric("valor_total", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmPedidoVendaItem = typeof crmPedidoVendaItens.$inferSelect
export type NewCrmPedidoVendaItem = typeof crmPedidoVendaItens.$inferInsert