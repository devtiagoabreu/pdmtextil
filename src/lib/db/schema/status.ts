import { pgTable, serial, varchar, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core"

export const status = pgTable("status", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  rotulo: varchar("rotulo", { length: 100 }),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  cor: varchar("cor", { length: 7 }),
  ordem: integer("ordem").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqueNomeTipo: unique().on(t.nome, t.tipo),
}))

export type Status = typeof status.$inferSelect
export type NewStatus = typeof status.$inferInsert
