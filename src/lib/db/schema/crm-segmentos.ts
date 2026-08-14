import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core"

export const crmSegmentos = pgTable("crm_segmentos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmSegmento = typeof crmSegmentos.$inferSelect
export type NewCrmSegmento = typeof crmSegmentos.$inferInsert
