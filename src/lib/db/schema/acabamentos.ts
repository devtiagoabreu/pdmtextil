import { pgTable, serial, varchar, text, boolean } from "drizzle-orm/pg-core"

export const acabamentos = pgTable("acabamentos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 50 }),
  ativo: boolean("ativo").default(true),
})

export type Acabamento = typeof acabamentos.$inferSelect
export type NewAcabamento = typeof acabamentos.$inferInsert