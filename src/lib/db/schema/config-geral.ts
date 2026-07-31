import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core"

export const configGeral = pgTable("config_geral", {
  chave: varchar("chave", { length: 100 }).primaryKey(),
  valor: text("valor"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ConfigGeral = typeof configGeral.$inferSelect
export type NewConfigGeral = typeof configGeral.$inferInsert
