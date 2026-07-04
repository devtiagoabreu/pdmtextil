import { pgTable, serial, integer, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { crmEmpresas } from "./crm-empresas"

export const crmTimelineEventos = pgTable("crm_timeline_eventos", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").notNull().references(() => crmEmpresas.id),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  descricao: text("descricao").notNull(),
  metadados: jsonb("metadados").$type<Record<string, any>>().default({}),
  dataEvento: timestamp("data_evento").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmTimelineEvento = typeof crmTimelineEventos.$inferSelect
export type NewCrmTimelineEvento = typeof crmTimelineEventos.$inferInsert
