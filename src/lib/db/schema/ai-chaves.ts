import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const aiChaves = pgTable("ai_chaves", {
  id: serial("id").primaryKey(),
  provedor: varchar("provedor", { length: 30 }).notNull().default("groq"),
  nome: varchar("nome", { length: 100 }).notNull(),
  chaveApi: varchar("chave_api", { length: 500 }).notNull(),
  urlBase: varchar("url_base", { length: 500 }),
  modelo: varchar("modelo", { length: 200 }),
  ordem: integer("ordem").notNull().default(1),
  ativo: boolean("ativo").notNull().default(true),
  failCount: integer("fail_count").notNull().default(0),
  ultimaFalha: timestamp("ultima_falha"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type AiChave = typeof aiChaves.$inferSelect
export type NewAiChave = typeof aiChaves.$inferInsert
