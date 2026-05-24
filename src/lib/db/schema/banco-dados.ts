import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core"

export const bancosDados = pgTable("bancos_dados", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  connectionString: varchar("connection_string", { length: 500 }).notNull(),
  ativo: boolean("ativo").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type BancoDados = typeof bancosDados.$inferSelect
export type NewBancoDados = typeof bancosDados.$inferInsert
