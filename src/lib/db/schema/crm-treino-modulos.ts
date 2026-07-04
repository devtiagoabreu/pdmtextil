import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const crmTreinoModulos = pgTable("crm_treino_modulos", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao"),
  icone: varchar("icone", { length: 50 }).default("BookOpen"),
  cor: varchar("cor", { length: 7 }).default("#6366f1"),
  ordem: integer("ordem").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmTreinoModulo = typeof crmTreinoModulos.$inferSelect
export type NewCrmTreinoModulo = typeof crmTreinoModulos.$inferInsert
