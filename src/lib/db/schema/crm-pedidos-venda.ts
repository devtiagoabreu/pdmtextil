import { pgTable, serial, integer, varchar, date, text, timestamp } from "drizzle-orm/pg-core"
import { crmOportunidades } from "./crm-oportunidades"

export const crmPedidosVenda = pgTable("crm_pedidos_venda", {
  id: serial("id").primaryKey(),
  oportunidadeId: integer("oportunidade_id").notNull().references(() => crmOportunidades.id, { onDelete: "cascade" }),
  numero: varchar("numero", { length: 100 }),
  dataEmissao: date("data_emissao"),
  status: varchar("status", { length: 30 }).notNull().default("ABERTO"),
  observacao: text("observacao"),
  origem: varchar("origem", { length: 20 }).notNull().default("MANUAL"),
  referenciaExterna: varchar("referencia_externa", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmPedidoVenda = typeof crmPedidosVenda.$inferSelect
export type NewCrmPedidoVenda = typeof crmPedidosVenda.$inferInsert